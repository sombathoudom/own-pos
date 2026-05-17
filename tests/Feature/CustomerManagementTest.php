<?php

use App\Models\Customer;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated users can manage customers', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => 'Dara Sok',
            'phone' => '012345678',
            'address' => 'Phnom Penh',
            'status' => 'active',
        ])
        ->assertRedirect(route('customers.index'));

    $customer = Customer::query()->firstOrFail();

    $this->assertDatabaseHas('customers', [
        'id' => $customer->id,
        'name' => 'Dara Sok',
        'phone' => '012345678',
        'address' => 'Phnom Penh',
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->get(route('customers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/customers/index')
            ->where('customers.data.0.name', 'Dara Sok')
        );

    $this->actingAs($user)
        ->put(route('customers.update', $customer), [
            'name' => 'Dara Updated',
            'phone' => '098765432',
            'address' => 'Siem Reap',
            'status' => 'inactive',
        ])
        ->assertRedirect(route('customers.index'));

    $this->assertDatabaseHas('customers', [
        'id' => $customer->id,
        'name' => 'Dara Updated',
        'phone' => '098765432',
        'address' => 'Siem Reap',
        'status' => 'inactive',
    ]);

    $this->actingAs($user)
        ->delete(route('customers.destroy', $customer))
        ->assertRedirect(route('customers.index'));

    $this->assertDatabaseMissing('customers', [
        'id' => $customer->id,
    ]);
});

test('creating a customer from pos redirects back with selection payload', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('customers.store'), [
            'name' => 'POS Customer',
            'phone' => '011222333',
            'address' => 'Takeo',
            'status' => 'active',
            'redirect_to' => 'pos',
        ])
        ->assertRedirect(route('pos'))
        ->assertSessionHas('createdCustomer', fn (array $customer) => $customer['name'] === 'POS Customer');
});

test('authenticated users can search customers through api', function () {
    $user = User::factory()->create();

    Customer::factory()->create([
        'name' => 'Dara Search',
        'phone' => '012300000',
        'status' => 'active',
    ]);

    Customer::factory()->create([
        'name' => 'Hidden Customer',
        'phone' => '099999999',
        'status' => 'inactive',
    ]);

    $this->actingAs($user)
        ->getJson(route('customers.search', ['search' => 'Dara']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Dara Search');
});

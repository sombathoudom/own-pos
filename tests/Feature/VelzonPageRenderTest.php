<?php

use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;

test('welcome page renders the Velzon home component', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('canRegister', Features::enabled(Features::registration())));
});

test('login and forgot password screens can be rendered', function () {
    $this->get(route('login'))->assertSuccessful();
    $this->get(route('password.request'))->assertSuccessful();
});

test('register screen can be rendered when registration is enabled', function () {
    if (! Features::enabled(Features::registration())) {
        $this->markTestSkipped('Registration is disabled.');
    }

    $this->get(route('register'))->assertSuccessful();
});

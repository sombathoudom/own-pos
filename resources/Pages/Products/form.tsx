import React, { useEffect, useMemo, useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import ModalHost from "../../Components/ModalHost";
import CategoryForm from "../Categories/categoryform";
import UnitForm from "../Units/unitform";
import { useTranslation } from "react-i18next";

import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Head } from "@inertiajs/react";
import UiContent from "../../Components/Common/UiContent";
import { Card, Col, Container, Row } from "react-bootstrap";
import MediaPickerInputGroup from "../../Components/Form/MediaPickerInputGroup";

type Props = {
  mode: "create" | "edit";
  product: Product | null;
  categories: Category[];
  units: Unit[];
};

type ModalScreen = "category_create" | "unit_create" | null;

export default function ProductFormPage({
  mode,
  product,
  categories: initCats,
  units: initUnits,
}: Props) {
  const { flash } = usePage<PageProps>().props;
  const isEdit = mode === "edit";

  const [categories, setCategories] = useState<Category[]>(initCats ?? []);
  const [units, setUnits] = useState<Unit[]>(initUnits ?? []);
  const [modal, setModal] = useState<{ open: boolean; screen: ModalScreen }>({
    open: false,
    screen: null,
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    product?.image_url ?? null
  );

  const closeModal = () => setModal({ open: false, screen: null });

  const form = useForm({
    name: product?.name ?? "",
    category_id: product?.category_id ? String(product.category_id) : "",
    unit_id: product?.unit_id ? String(product.unit_id) : "",
    image_media_id: product?.image_media_id ?? null,
    after: "index" as "index" | "create" | "edit",
  });

  useEffect(() => {
    setImagePreviewUrl(product?.image_url ?? null);
  }, [product?.id, product?.image_url]);

  const upsertSort = <T extends { id: number; name: string }>(list: T[], item: T) => {
    const exists = list.some((x) => String(x.id) === String(item.id));
    const next = exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
    return next.sort((a, b) => a.name.localeCompare(b.name));
  };

  useEffect(() => {
    const p = flash?.payload;
    if (!p?.type || !p.data) return;

    if (p.type === "category") {
      setCategories((prev) => upsertSort(prev, p.data));
      form.setData("category_id", String(p.data.id));
      closeModal();
    }

    if (p.type === "unit") {
      setUnits((prev) => upsertSort(prev, p.data));
      form.setData("unit_id", String(p.data.id));
      closeModal();
    }
  }, [flash?.payload]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEdit ? route("products.update", product!.id) : route("products.store");

    isEdit
      ? form.put(url, { preserveScroll: true })
      : form.post(url, { preserveScroll: true });
  };

  const modalTitle = useMemo(() => {
    if (modal.screen === "category_create") return "Create Category";
    if (modal.screen === "unit_create") return "Create Unit";
    return "";
  }, [modal.screen]);

  const t = useTranslation("lv").t;

  return (
    <React.Fragment>
      <Head title="Basic Elements | Velzon - React Admin & Dashboard Template" />
      <UiContent />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Basic Elements" pageTitle="Forms" />

          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header>
                  <h4 className="card-title mb-0">
                    {isEdit ? "Edit Product" : "Create Product"}
                  </h4>
                </Card.Header>

                <Card.Body>
                  <form onSubmit={submit}>
                    <div className="mb-3">
                      <label className="form-label">Product Name</label>
                      <input
                        className={`form-control ${form.errors.name ? "is-invalid" : ""}`}
                        value={form.data.name}
                        onChange={(e) => form.setData("name", e.target.value)}
                      />
                      {form.errors.name && (
                        <div className="invalid-feedback">{String(form.errors.name)}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label d-flex justify-content-between align-items-center">
                        <span>Category</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setModal({ open: true, screen: "category_create" })}
                        >
                          + New Category
                        </button>
                      </label>
                      <select
                        className={`form-select ${form.errors.category_id ? "is-invalid" : ""}`}
                        value={form.data.category_id}
                        onChange={(e) => form.setData("category_id", e.target.value)}
                      >
                        <option value="">-- Select --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {form.errors.category_id && (
                        <div className="invalid-feedback">{String(form.errors.category_id)}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label d-flex justify-content-between align-items-center">
                        <span>Unit</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setModal({ open: true, screen: "unit_create" })}
                        >
                          + New Unit
                        </button>
                      </label>
                      <select
                        className={`form-select ${form.errors.unit_id ? "is-invalid" : ""}`}
                        value={form.data.unit_id}
                        onChange={(e) => form.setData("unit_id", e.target.value)}
                      >
                        <option value="">-- Select --</option>
                        {units.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      {form.errors.unit_id && (
                        <div className="invalid-feedback">{String(form.errors.unit_id)}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Product Image</label>
                      <MediaPickerInputGroup
                        value={form.data.image_media_id}
                        onChange={(id: number | null) => form.setData("image_media_id", id)}
                        targetType="product"
                        collection="product_image"
                        previewUrl={imagePreviewUrl}
                        onPreviewUrlChange={setImagePreviewUrl}
                      />
                      {form.errors.image_media_id && (
                        <div className="text-danger small mt-1">
                          {String(form.errors.image_media_id)}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">After save</label>
                      <select
                        className="form-select"
                        value={form.data.after}
                        onChange={(e) => form.setData("after", e.target.value as any)}
                      >
                        <option value="index">Option 1: Go to index</option>
                        <option value="create">Option 2: Go to create</option>
                        <option value="edit">Option 3: Go to edit</option>
                      </select>
                    </div>

                    <button className="btn btn-primary" disabled={form.processing}>
                      {form.processing ? "Saving..." : "Save Product"}
                      {t("ui.hello")}
                    </button>
                  </form>

                  <ModalHost title={modalTitle} open={modal.open} onClosed={closeModal}>
                    {modal.screen === "category_create" && (
                      <CategoryForm
                        mode="create"
                        category={null}
                        context="modal"
                        showAfterOptions={false}
                      />
                    )}

                    {modal.screen === "unit_create" && (
                      <UnitForm
                        mode="create"
                        unit={null}
                        context="modal"
                        showAfterOptions={false}
                      />
                    )}
                  </ModalHost>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
}

ProductFormPage.layout = (page: any) => <Layout children={page} />;
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastifyHost() {
  return (
    <ToastContainer
      position="top-right"
      hideProgressBar
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
    />
  );
}

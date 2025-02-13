// components/Layout.js
"use client";

import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sidebar en la parte superior */}
      <Sidebar />

      {/* Contenido de la página debajo del Sidebar */}
      <main className="flex-1 p-5">
        {children}
      </main>
    </div>
  );
};

export default Layout;
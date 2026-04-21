import { useState } from "react";
import styles from "./FilterSection.module.css";

export default function FilterSection({
  title,
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <span className={styles.icon}>{open ? "⌃" : "⌄"}</span>
      </button>

      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
}
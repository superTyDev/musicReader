import { useState } from "react";
import styles from "../styles/Collapsible.module.css";

const Collapsible = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleCollapse = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`${styles.collapsible} ${isOpen ? styles.open : ""}`}>
            <div className={styles.collapsibleHeader} onClick={toggleCollapse}>
                <span>{title}</span>{" "}
                <i>{isOpen ? "expand_less" : "expand_more"}</i>
            </div>
            <div className={styles.collapsibleContent}>{children}</div>
        </div>
    );
};

export default Collapsible;

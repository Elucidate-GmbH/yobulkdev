import React from 'react';
import styles from './Button.module.css'

const Button = ({
  type = "primary",
  size = "auto",
  icon = null,
  rtl = false,
  hint = "",
  hintPosition = "bottom",
  customStyle = {},
  onClick,
  disabled = false,
  children
}) => {
  return (
    <button
      className={`${styles.btn} ${styles[type]} ${styles[size]} ${rtl ? styles['flex-row-reverse'] : ''}`}
      style={customStyle}
      onClick={onClick}
      data-tooltip={hint}
      data-placement={hintPosition}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;

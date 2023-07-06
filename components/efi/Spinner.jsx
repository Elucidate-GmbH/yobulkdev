import React from 'react';
import styles from './Spinner.module.css';

const Spinner = ({ ready }) => {
  return (
    <span className={`${styles.loader}`} />
  );
};

export default Spinner;

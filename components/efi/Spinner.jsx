import React from 'react';
import styles from './Spinner.module.css';

const Spinner = ({ width = '80px', height = '80px', position = 'absolute', borderWidth = '6px', color = '#1E40AFFF' }) => {
  return (
    <span className={`${styles.loader}`} style={{ height, width, position, borderWidth, borderBottomColor: color }} />
  );
};

export default Spinner;

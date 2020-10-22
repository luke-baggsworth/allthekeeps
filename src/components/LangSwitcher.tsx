import React, { useState, useEffect } from 'react';
import { css } from 'emotion';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaAngleDown } from 'react-icons/fa';

export function LangSwitcher() {
  const { i18n } = useTranslation();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    if (isMenuOpen) {
      setMenuOpen(false);
    }
  }

  useEffect(() => {
    document.addEventListener('click', toggleMenu);
    return () => {
      document.removeEventListener('click', toggleMenu);
    }
  }, [isMenuOpen])

  return (
    <div className={css`
      display: flex;
      justify-content: center;
      align-items: center;
      margin-left: 20px;
      position: relative;
    `}>
      <div className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px;
        cursor: pointer;
        background-color: #f2f2f2;
        border-radius: 3px;
        transition: background-color 0.2s;

        &:hover {
          background-color: #e4e3e3;
        }
      `} onClick={() => setMenuOpen(true)}>
        <FaGlobe/>
        <span style={{ margin: '0 5px' }}>{i18n.language === 'en' ? 'English' : 'Русский'}</span>
        <FaAngleDown/>
      </div>
      <div className={css`
        position: absolute;
        right: 10px;
        top: 85%;
        width: 0; 
        height: 0;
        z-index: 10;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-bottom: 7px solid #fff;
      `} style={{ display: isMenuOpen ? 'block' : 'none' }}></div>
      <ul className={css`
        position: absolute;
        top: 95%;
        right: 0;
        margin:0;
        padding:0;
        list-style: none;
        z-index: 1;
        border-radius: 5px;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.2);
        background: #fff;
        width: 100%;
        padding: 7px;

        & li {
          cursor: pointer;
          padding: 7px;
          border-radius: 4px;
        }

        & li:hover {
          background-color: #f2f2f2;
        }

      `} style={{ display: isMenuOpen ? 'block' : 'none' }}>
        <li onClick={() => i18n.changeLanguage('en')}>English</li>
        <li onClick={() => i18n.changeLanguage('ru')}>Русский</li>
      </ul>
    </div>
  );
}
import React from "react";
import {Paper} from "../design-system/Paper";
import { useTranslation } from 'react-i18next';

export function About() {
  const { t } = useTranslation();

  return <div style={{
    padding: '20px'
  }}>
    <Paper padding>
      <h3>{t('about.idea')}</h3>
      <p>
        {t('about.idea_description1')} {t('about.idea_description2')} <strong>{t('about.idea_description3')}</strong> {t('about.idea_description4')}
        {" "} <a href={"https://keep-explorer.herokuapp.com/"}>KeepExplorer</a> {t('about.idea_description5')}
        {" "} <a href={"https://etherscan.io/token/0x85eee30c52b0b379b046fb0f85f4f3dc3009afec"}>Etherscan</a>.
      </p>

      <h3>{t('about.code')}</h3>
      <p>
      {t('about.code_description1')} <a href={"https://github.com/miracle2k/allthekeeps"}>{t('about.code_description2')}</a>. {t('about.code_description3')} <a href={"https://thegraph.com/"}>The Graph</a>, {t('about.code_description4')}
        {" "} <a href={"https://thegraph.com/explorer/subgraph/miracle2k/keep-network"}>{t('about.code_description5')}</a>. {t('about.code_description6')}
        {" "} <a href={"https://github.com/miracle2k/allthekeeps-graph"}>{t('about.code_description2')}</a>.
      </p>
      <p>
        <a href={"https://github.com/miracle2k/keep-pricefeed"}>{t('about.code_description7')}</a> {t('about.code_description8')}
        {t('about.code_description9')}
      </p>
      <p>
        {t('about.built')} <a href={"http://twitter.com/elsdoerfer/"}>@elsdoerfer</a>
      </p>
    </Paper>

  </div>
}
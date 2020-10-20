import {gql, useQuery} from "@apollo/client";
import React from "react";
import {useParams} from 'react-router';
import {css} from "emotion";
import {Paper} from "../../design-system/Paper";
import {Helmet} from "react-helmet";
import {Box} from "../../components/Box";
import {getSatoshiesAsTBTC} from "../../utils/getSatoshisAsTBTC";
import {Tab, TabList, TabPanel, Tabs} from "react-tabs";
import {GetOperatorQuery} from "../../generated/graphql";
import {KeepsTable} from "./KeepsTable";
import {BeaconGroupsTable} from "./BeaconGroupTable";
import { useTranslation } from 'react-i18next';


const OPERATOR_QUERY = gql`
    query GetOperator($id: ID!) {
        operator(id: $id) {
            id,
            address,
            bonded,
            unboundAvailable,
            stakedAmount,
            totalFaultCount,
            attributableFaultCount,
            totalTBTCRewards,
            beaconGroupMemberships(orderBy: groupCreatedAt, orderDirection: desc) {
                count,
                reward,
                group {
                    id,
                    pubKey,
                    createdAt,
                }
            }
        }
    }
`;


export function Operator() {
  const { t } = useTranslation();
  return <div className={css`
      padding: 1em;
    `}>
    <Helmet>
      <title>{t('operator')}</title>
    </Helmet>
    <Content />
  </div>
}

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

const formatterBTC = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6
});


export function Content() {
  let { operatorId } = useParams<any>();
  const { loading, error, data } = useQuery<GetOperatorQuery>(OPERATOR_QUERY, {variables: {id: operatorId}});
  const { t } = useTranslation();

  if (loading) return <p>{t('loading')}...</p>;
  if (error || !data) return <p>{t('error')} :( {""+ error}</p>;
  const operator = data.operator;
  if (!operator) {
    return <p>{t('operator$.not_found')}</p>
  }

  const total = (parseFloat(operator.unboundAvailable) + parseFloat(operator.bonded));
  const bonded = parseFloat(operator.bonded);

  return <div>
    <div className={css`
      display: flex;
      flex-direction: row;
      font-size: 30px;
      margin-bottom: 15px;
  `}>
      {t('operator')}: {operator.address}
    </div>


    <div className={css`
      display: flex;
      flex-direction: row;
      & > * {
        margin-right: 20px;
      }
      margin-bottom: 20px;
  `}>
      <Box label={t('operator$.bonded')}>
        <div>{formatter.format(operator.bonded)} ETH</div>

        {total > 0 ? <div style={{fontSize: '20px', color: 'gray'}}>
          {formatter.format((bonded / total * 100))}% of {formatter.format(total)} ETH
        </div> : null}
      </Box>

      <Box label={t('operator$.available_to_bond')}>
        <div>
          {formatter.format(operator.unboundAvailable)} ETH
        </div>
      </Box>

      <Box label={t('operator$.staked')}>
        <div>
          {formatter.format(operator.stakedAmount)} KEEP
        </div>
      </Box>

      <Box label={t('operator$.faults')} tooltip={t('operator$.faults_tooltip')}>
        <div>
          {operator.attributableFaultCount > 0 ? <>
            {operator.attributableFaultCount} / </> : null}
          {operator.totalFaultCount}
        </div>
      </Box>

      <Box label={t('operator$.rewards')}>
        <div>
          {formatterBTC.format(getSatoshiesAsTBTC(operator.totalTBTCRewards))} TBTC
        </div>
      </Box>
    </div>

    <Tabs>
      <TabList>
        <Tab>
          {t('operator$.keeps')}
        </Tab>
        <Tab>
          {t('operator$.beacon_groups')}
        </Tab>
      </TabList>

      <TabPanel>
        <Paper padding>
          <h3 style={{marginTop: 0}}>{t('operator$.keeps')}</h3>
          <KeepsTable operatorId={operatorId} />
        </Paper>
      </TabPanel>
      <TabPanel>
        <Paper padding>
          <h3 style={{marginTop: 0}}>{t('operator$.rand_beacon_groups')}</h3>
          <BeaconGroupsTable memberships={operator.beaconGroupMemberships} />
        </Paper>
      </TabPanel>
    </Tabs>
  </div>
}



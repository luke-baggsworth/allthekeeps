import React, { useState } from "react";
import Dropdown from "react-dropdown-aria";
import { gql, useQuery } from "@apollo/client";
import { css } from "emotion";
import { style } from './../index';
import { LiquidationsTable } from './LiquidationsTable';
import { Paper } from "../../../design-system/Paper";
import { usePriceFeed } from "./../../../components/PriceFeed";
import { getCollaterizationRatio } from "./../../../components/CollateralizationStatus";

const DEPOSITS_QUERY = gql`
    query GetDeposits {
        deposits(first: 1000) {
          id
          contractAddress
          currentState
          bondedECDSAKeep {
            id
            totalBondAmount
            createdAt
            members {
              id,
              address
            }
          }
          lotSizeSatoshis
          initialCollateralizedPercent
          undercollateralizedThresholdPercent
          severelyUndercollateralizedThresholdPercent
        }
    }
`;

function filterDeposits(data: any, state: DepositState): any[] {
  return data.deposits.filter((d: any) => d.currentState === state);
}


export function Liquidations() {
  const [view, setView] = useState<DepositState>("ACTIVE");
  const { loading, error, data } = useQuery(DEPOSITS_QUERY);
  const price = usePriceFeed();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :( {""+ error}</p>;

  const filteredData: Record<DepositState, any[]> = {
    ACTIVE: filterDeposits(data, 'ACTIVE'),
    COURTESY_CALL: filterDeposits(data, 'COURTESY_CALL'),
    FRAUD_LIQUIDATION_IN_PROGRESS: filterDeposits(data, 'FRAUD_LIQUIDATION_IN_PROGRESS'),
    LIQUIDATION_IN_PROGRESS: filterDeposits(data, 'LIQUIDATION_IN_PROGRESS'),
    LIQUIDATED: filterDeposits(data, 'LIQUIDATED'),
  }

  const detailsContainerStyle = css`margin: 20px 0; color: #777;`;
  const detailsCountStyle = css`color: #3F51B5; font-weight: bold;`;

  function sortDeposits(d1: any, d2: any) {
    if (!price) return 0;
    const ratio1 = getCollaterizationRatio(d1, price);
    const ratio2 = getCollaterizationRatio(d2, price);
    return ratio1 - ratio2;
  }

  return (
    <div style={{padding: '20px'}}>

      <div className={detailsContainerStyle}>
        <div>
          Active deposits&nbsp;
          <span className={detailsCountStyle}>{filteredData['ACTIVE'].length}</span>
        </div>
        <div>
          Courtesy call&nbsp;
          <span className={detailsCountStyle}>{filteredData['COURTESY_CALL'].length}</span>
        </div>
        <div>
          Fraud liquidation in progress&nbsp;
          <span className={detailsCountStyle}>{filteredData['FRAUD_LIQUIDATION_IN_PROGRESS'].length}</span>
        </div>
        <div>
          Liquidation in progress&nbsp;
          <span className={detailsCountStyle}>{filteredData['LIQUIDATION_IN_PROGRESS'].length}</span>
        </div>
        <div>
          Liquidated&nbsp;
          <span className={detailsCountStyle}>{filteredData['LIQUIDATED'].length}</span>
        </div>
      </div>

      <Paper padding>
        <div style={{
          marginBottom: '15px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end'
        }}>
          <div className={css`
            display: inline-block;
            width: 180px;
          `}>
            <Dropdown
                style={style}
                value={view}
                onChange={(option) => {
                  setView(option.value as DepositState);
                }}
                optionItemRenderer={item => {
                  return <span>{item.option.title}</span>
                }}
                options={[
                  { value: 'ACTIVE', title: 'Active deposits' },
                  { value: 'COURTESY_CALL', title: 'Courtesy call' },
                  { value: 'FRAUD_LIQUIDATION_IN_PROGRESS', title: 'Fraud liquidation in progress' },
                  { value: 'LIQUIDATION_IN_PROGRESS', title: 'Liquidation in progress' },
                  { value: 'LIQUIDATED', title: 'Liquidated' }
                ]}
            />
          </div>
        </div>
      <LiquidationsTable deposits={filteredData[view].sort(sortDeposits)} price={price} />
    </Paper>
    </div>
  );
}

type DepositState = 
  'ACTIVE' | 
  'COURTESY_CALL' | 
  'FRAUD_LIQUIDATION_IN_PROGRESS' | 
  'LIQUIDATION_IN_PROGRESS' | 
  'LIQUIDATED';
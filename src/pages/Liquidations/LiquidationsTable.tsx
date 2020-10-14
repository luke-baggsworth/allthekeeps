import React from "react";
import { Link } from "react-router-dom";
import { CollaterizationStatusWithPrice } from "../../components/CollateralizationStatus";
import { InfoTooltip } from "../../components/InfoTooltip";
import { TimeToNow } from "../../components/FormattedTime";
import { Table } from "../../components/Table";
import { Address } from "../../components/Address";
import { getWeiAsEth } from "../../utils/getWeiAsEth";
import { getSatoshisAsBitcoin } from "../../utils/getSatoshisAsBitcoin";

const formatter = new Intl.NumberFormat("en-US", {
  style: 'percent',
  maximumFractionDigits: 2
});

function formatDepositId(id: string) {
  return id.substr(0, 5) + '..' + id.substr(-4);
}

export function LiquidationsTable({ deposits, price }: any) {
  return (
    <>
      <Table style={{width: '100%'}} >
        <thead>
        <tr>
          <th>ID</th>
          <th>Collaterialization</th>
          <th>CreatedAt</th>
          <th>Lot size</th>
          <th>IC<InfoTooltip>Initial Collateralized</InfoTooltip></th>
          <th>UT<InfoTooltip>Undercollateralized Threshold</InfoTooltip></th>
          <th>SUT<InfoTooltip>Severely Undercollateralized Threshold</InfoTooltip> </th>
          <th>Bonded size</th>
          <th>Members</th>
        </tr>
        </thead>
        <tbody>
          {deposits.length ? deposits.map((deposit: any) => {
            return (
              <tr key={deposit.id}>
                <td title={deposit.id}>
                  <Link to={`/deposit/${deposit.id}`}>
                    {formatDepositId(deposit.contractAddress)}
                  </Link>
                </td>
                <td>
                  {deposit.currentState === 'LIQUIDATED' ? 
                    null :
                    <CollaterizationStatusWithPrice 
                      deposit={deposit} 
                      highlightNormal={true} 
                      style={{fontWeight: 'bold'}}
                      price={price}
                    />
                  }
                  </td>
                <td> <TimeToNow time={deposit.bondedECDSAKeep.createdAt} /> </td>
                <td>
                  <span style={{color: 'gray', fontSize: '0.8em'}}>BTC</span>&nbsp;
                  {getSatoshisAsBitcoin(deposit.lotSizeSatoshis ?? 0)}
                </td>
                <td>{formatter.format(deposit.initialCollateralizedPercent / 100)}</td>
                <td>{formatter.format(deposit.undercollateralizedThresholdPercent / 100)}</td>
                <td>{formatter.format(deposit.severelyUndercollateralizedThresholdPercent / 100)}</td>
                <td>{getWeiAsEth(deposit.bondedECDSAKeep.totalBondAmount).toFixed(2)} ETH</td>
                <td>
                  {<div>
                    {deposit.bondedECDSAKeep.members.map((m: any) => {
                      return <div key={m.address}>
                      <Address address={m.address} to={`/operator/${m.address}`} />
                    </div>
                    })}
                  </div>}
                </td>
              </tr>
            );
          }) : <tr><td colSpan={10}><h3 style={{ color: '#FF5722' }}>No data</h3></td></tr>}
        </tbody>
      </Table>
    </>
  );
}

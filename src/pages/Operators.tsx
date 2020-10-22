import {gql, useQuery} from "@apollo/client";
import React from "react";
import {Paper} from "../design-system/Paper";
import {css} from "emotion";
import { Address } from "../components/Address";
import {ExternalLinkIcon} from "../components/ExternalLinkIcon";
import {InfoTooltip} from "../components/InfoTooltip";
import {Helmet} from "react-helmet";
import {SortableHeader, SortState, Table, useSort} from "../components/Table";
import {usePriceFeed} from "../components/PriceFeed";
import {Box} from "../components/Box";
import {GetOperatorsQuery} from "../generated/graphql";
import {useEtherscanDomain} from "../NetworkContext";
import {getWeiAsEth} from "../utils/getWeiAsEth";
import {getSatoshiesAsTBTC} from "../utils/getSatoshisAsTBTC";
import { useTranslation } from 'react-i18next';
import {useQueryWithTimeTravel} from "../TimeTravel";

const OPERATOR_QUERY = gql`
    query GetOperators(
        $orderBy: Operator_orderBy,
        $direction: OrderDirection,
        $block: Block_height
    ) {
        operators(first: 1000, orderBy: $orderBy, orderDirection: $direction, block: $block) {
            id,
            address,
            bonded,
            unboundAvailable,
            totalKeepCount,
            activeKeepCount,
            stakedAmount,
            totalFaultCount,
            attributableFaultCount,
            totalTBTCRewards,
            totalETHRewards
        },
        stats: statsRecord(id: "current", block: $block) {
            availableToBeBonded,
            totalBonded
        }
    }
`;


export function Operators() {
  const sortState = useSort("activeKeepCount");
  const { loading, error, data } = useQueryWithTimeTravel<GetOperatorsQuery>(OPERATOR_QUERY, {
    variables: {
      orderBy: sortState.column,
      direction: sortState.direction
    }
  });
  const price: any = usePriceFeed();
  const { t } = useTranslation();

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{t('error')} :( {""+ error}</p>;

  const remainingCapacityBTC = price?.val ? parseFloat(data!.stats!.availableToBeBonded) / 1.5 * price.val : null;

  return  <div style={{padding: '20px'}}>
    <Helmet>
      <title>{t('header.operators')}</title>
    </Helmet>
    <h1 style={{marginTop: 0, marginBottom: 5}}>{t('header.operators')}</h1>
    <div className={css`
      display: flex;
      flex-direction: row;
      & > * {
        margin-right: 20px;
      }
  `}>
      <Box
        label={t('operators$.total_bounded')}
        tooltip={t('operators$.total_bounded_tooltip')}
      >
        <div>{formatterSimple.format(data!.stats!.totalBonded)} <span style={{fontSize: '0.8em'}}>ETH</span></div>
      </Box>
      <Box
        label={t('operators$.available_bonding')}
        tooltip={t('operators$.available_bonding_tooltip')}
      >
        <div>{formatterSimple.format(data!.stats!.availableToBeBonded)} <span style={{fontSize: '0.8em'}}>ETH</span></div>
        {remainingCapacityBTC !== null ? <div style={{fontSize: '20px', color: 'gray'}}>
          {t('operators$.available_capacity')} ~{formatter.format(remainingCapacityBTC)} BTC
        </div> : null}
      </Box>
    </div>
    <Paper padding>
      <OperatorsTable data={data} sortState={sortState} />
    </Paper>
  </div>
}


const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

const formatterSimple = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

const formatterBTC = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6
});

export function OperatorsTable(props: {
  data: any,
  sortState: SortState,
}) {
  const {data} = props;
  const etherscan = useEtherscanDomain();
  const price = usePriceFeed();
  const { t } = useTranslation();

  return <Table
      style={{width: '100%'}}>
    <thead>
    <tr>
      <th>{t('address')}</th>
      <th>
        <SortableHeader fieldId={"activeKeepCount"} state={props.sortState}>
          # {t('keeps')} <InfoTooltip>{t('operators$.keeps_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>      
        <SortableHeader fieldId={"bonded"} state={props.sortState}>
          {t('amount_bonded')} <InfoTooltip>{t('operators$.amount_bonded_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"unboundAvailable"} state={props.sortState}>
          {t('amount_available')} <InfoTooltip>{t('operators$.amount_available_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"stakedAmount"} state={props.sortState}>
          {t('amount_staked')} <InfoTooltip>{t('operators$.amount_staked_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"totalTBTCRewards"} state={props.sortState}>
          {t('BTC_rewards')} <InfoTooltip>{t('operators$.BTC_rewards_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"totalETHRewards"} state={props.sortState}>
          {t('ETH_rewards')} <InfoTooltip>{t('operators$.ETH_rewards_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"totalFaultCount"} state={props.sortState}>
          {t('faults')} <InfoTooltip>{t('operators$.faults_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
    </tr>
    </thead>
    <tbody>
    {data.operators.map((member: any) => {
      const unbound = parseFloat(member.unboundAvailable);
      const total = (unbound + parseFloat(member.bonded));
      const bonded = parseFloat(member.bonded);
      const capacityBTC = price?.val ? (unbound / 1.5 * 3) * price.val : null;

      return  <tr key={member.id}>
        <td>
          <Address address={member.address} to={`/operator/${member.address}`} />
          <a title={"Open on Etherscan"} href={`https://${etherscan}/address/${member.address}`} className={css`
                font-size: 0.8em;
                padding-left: 0.2em;
               `}>
            <ExternalLinkIcon />
          </a>
        </td>
        <td>{member.activeKeepCount}<span style={{color: 'gray', fontSize: '0.8em'}}> / {member.totalKeepCount}</span></td>
        <td>
          <span style={{color: 'gray', fontSize: '0.8em'}}>ETH</span> {formatterSimple.format(bonded)}
          {" "}
          {total > 0 ? <span style={{color: 'gray', fontSize: '0.8em'}}>
            ({formatterSimple.format(bonded / total * 100)}%)
          </span> : null}
        </td>
        <td>
          <span style={{color: 'gray', fontSize: '0.8em'}}>ETH</span> {formatterSimple.format(unbound)}
          {" "}
          {(capacityBTC != null && unbound) ? <span style={{color: 'gray', fontSize: '0.8em'}}>
            ~{formatter.format(capacityBTC)} BTC
          </span> : null}
        </td>
        <td>
          <span style={{color: 'gray', fontSize: '0.8em'}}>KEEP</span> {formatterSimple.format(member.stakedAmount)}
        </td>
        <td>
          <span style={{color: 'gray', fontSize: '0.8em'}}>TBTC</span> {formatterBTC.format(getSatoshiesAsTBTC(member.totalTBTCRewards))}
        </td>
        <td>
          <span style={{color: 'gray', fontSize: '0.8em'}}>ETH</span> {formatter.format(getWeiAsEth(member.totalETHRewards))}
        </td>
        <td>
          {member.attributableFaultCount > 0 ? <>
            {member.attributableFaultCount} / </> : null}
          {member.totalFaultCount || ""}
        </td>
      </tr>
    })}
    </tbody>
  </Table>
}

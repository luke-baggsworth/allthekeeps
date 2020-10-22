import {gql, useQuery} from "@apollo/client";
import React from "react";
import {Paper} from "../design-system/Paper";
import { Address } from "../components/Address";
import {InfoTooltip} from "../components/InfoTooltip";
import {Helmet} from "react-helmet";
import {SortableHeader, SortState, Table, useSort} from "../components/Table";
import {GetUsersQuery} from "../generated/graphql";
import {useEtherscanDomain} from "../NetworkContext";
import { useTranslation } from 'react-i18next';
import {useQueryWithTimeTravel} from "../TimeTravel";

const USERS_QUERY = gql`
    query GetUsers(
        $orderBy: User_orderBy,
        $direction: OrderDirection,
        $block: Block_height
    ) {
        users(first: 1000, orderBy: $orderBy, orderDirection: $direction, block: $block) {
            id,
            address,
            numDepositsCreated,
            numDepositsUnfunded,
            numDepositsRedeemed,
            numOwnDepositsRedeemed
        }
    }
`;


export function Users() {
  const sortState = useSort("numDepositsCreated");
  const { t } = useTranslation();
  const { loading, error, data } = useQueryWithTimeTravel<GetUsersQuery>(USERS_QUERY, {
    variables: {
      orderBy: sortState.column,
      direction: sortState.direction
    }
  });

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{t('error')} :( {""+ error}</p>;

  return  <div style={{padding: '20px'}}>
    <Helmet>
      <title>{t('header.users')}</title>
    </Helmet>
    <h1 style={{marginTop: 0, marginBottom: 25}}>{t('header.users')}
    </h1>
    <Paper padding>
      <UsersTable data={data} sortState={sortState} />
    </Paper>
  </div>
}


export function UsersTable(props: {
  data: any,
  sortState: SortState,
}) {
  const {data} = props;
  const etherscan = useEtherscanDomain();
  const { t } = useTranslation();

  return <Table
      style={{width: '100%'}}>
    <thead>
    <tr>
      <th>{t('address')}</th>
      <th>
        <SortableHeader fieldId={"numDepositsCreated"} state={props.sortState}>
          # {t('users.created')} <InfoTooltip>{t('users.created_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"numDepositsUnfunded"} state={props.sortState}>
          # {t('users.unfunded')} <InfoTooltip>{t('users.unfunded_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"numDepositsRedeemed"} state={props.sortState}>
          # {t('users.redeemed')} <InfoTooltip>{t('users.redeemed_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
      <th>
        <SortableHeader fieldId={"numOwnDepositsRedeemed"} state={props.sortState}>
          # {t('users.own_redeemed')} <InfoTooltip>{t('users.own_redeemed_tooltip')}</InfoTooltip>
        </SortableHeader>
      </th>
    </tr>
    </thead>
    <tbody>
    {data.users.map((user: any) => {
      return  <tr key={user.id}>
        <td>
          <Address long address={user.address} />
        </td>
        <td>{user.numDepositsCreated}</td>
        <td>{user.numDepositsUnfunded}</td>
        <td>{user.numDepositsRedeemed}</td>
        <td>{user.numOwnDepositsRedeemed}</td>
      </tr>
    })}
    </tbody>
  </Table>
}

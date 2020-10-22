import {gql, useQuery} from "@apollo/client";
import React from "react";
import {Paper} from "../../design-system/Paper";
import {Hash} from "../../components/Address";
import {InfoTooltip} from "../../components/InfoTooltip";
import {Helmet} from "react-helmet";
import {Table} from "../../components/Table";
import {GetRelayEntriesQuery} from "../../generated/graphql";
import {TimeBetween, TimeToNow} from "../../components/FormattedTime";
import {Tab, TabList, TabPanel, Tabs } from "react-tabs";
import 'react-tabs/style/react-tabs.css';
import {ETHValue} from "../../components/ETHValue";
import {ETHTag, GweiTag} from "../../components/CurrencyTags";
import {getGroupName} from "./GroupName";
import { useTranslation } from 'react-i18next';
import {useQueryWithTimeTravel} from "../../TimeTravel";


const BEACON_QUERY = gql`
    query GetRelayEntries($block: Block_height) {
        randomBeaconGroups(first: 1000, orderBy: createdAt, orderDirection: desc, block: $block) {
            id,
            pubKey,
            createdAt,
            uniqueMemberCount,
            rewardPerMember,
        }
        relayEntries(first: 1000, orderBy: requestedAt, orderDirection: desc, block: $block) {
            id,
            requestId,
            value,
            requestedAt,
            generatedAt,
            rewardPerMember,
            group {
                id,
                pubKey
            }
        }
    }
`;


export function Beacon() {
  const { loading, error, data } = useQueryWithTimeTravel<GetRelayEntriesQuery>(BEACON_QUERY, );
  const { t } = useTranslation();

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{t('error')} :( {""+ error}</p>;

  return  <div style={{padding: '20px'}}>
    <Helmet>
      <title>{t('rand_beacon')}</title>
    </Helmet>
    <h1 style={{marginTop: 0, marginBottom: 25}}>
      {t('rand_beacon')}
    </h1>

    <Tabs>
      <TabList>
        <Tab>
          {t('entries')} <InfoTooltip>{t('beacon.entries_tooltip')}</InfoTooltip>
        </Tab>
        <Tab>
          {t('groups')} <InfoTooltip>{t('beacon.groups_tooltip')}</InfoTooltip>
        </Tab>
      </TabList>

      <TabPanel>
        <Paper padding>
          <RelayEntriesTable data={data} />
        </Paper>
      </TabPanel>
      <TabPanel>
        <Paper padding>
          <BeaconGroupsTable data={data} />
        </Paper>
      </TabPanel>
    </Tabs>
  </div>
}


export function RelayEntriesTable(props: {
  data: any,
}) {
  const {data} = props;
  const { t } = useTranslation();

  return <Table
      style={{width: '100%'}}>
    <thead>
    <tr>
      <th>
        {t('beacon.requested')}
      </th>
      <th>
        {t('beacon.provided')}
      </th>
      <th>
        {t('beacon.group')} <InfoTooltip>{t('beacon.group_tooltip')}</InfoTooltip>
      </th>
      <th>
        {t('beacon.reward')} <InfoTooltip>{t('beacon.reward_tooltip')}</InfoTooltip>
      </th>
      <th>
        {t('beacon.rand_val')}
      </th>
      <th>{t('beacon.req_id')}</th>
    </tr>
    </thead>
    <tbody>
    {data.relayEntries.map((entry: any) => {
      return  <tr key={entry.id}>
        <td><TimeToNow time={entry.requestedAt} /></td>
        <td>
          <TimeBetween earlier={entry.requestedAt} later={entry.generatedAt} />
        </td>
        <td>
          <Hash hash={entry.group.pubKey} to={`/group/${entry.group.id}`}>{getGroupName(entry.group.id)}</Hash>
        </td>
        <td>
          {
            entry.value ? <>
              <GweiTag /> <ETHValue unit={"gwei"} wei={entry.rewardPerMember} />
            </> : null
          }

        </td>
        <td style={{fontSize: '14px'}}>
          {entry.value ? <>{entry.value.slice(0, 12)}...</> : null}
        </td>
        <td>
          {entry.requestId}
        </td>
      </tr>
    })}
    </tbody>
  </Table>
}


export function BeaconGroupsTable(props: {
  data: any,
}) {
  const {data} = props;
  const { t } = useTranslation();

  return <Table
      style={{width: '100%'}}>
    <thead>
    <tr>
      <th>
        {t('beacon.group')}
      </th>
      <th>
        {t('beacon.total_rewards')} <InfoTooltip>{t('beacon.total_rewards_tooltip')}</InfoTooltip>
      </th>
      <th>
        {t('beacon.created')}
      </th>
    </tr>
    </thead>
    <tbody>
    {data.randomBeaconGroups.map((group: any) => {
      return  <tr key={group.id}>
        <td>
          <Hash hash={group.pubKey} to={`/group/${group.id}`}>{getGroupName(group.id)}</Hash>
        </td>
        {/*<td>*/}
        {/*  {group.memberCount}*/}
        {/*</td>*/}
        <td>
          <ETHTag /> <ETHValue unit={"eth"} wei={group.rewardPerMember} />
        </td>
        <td><TimeToNow time={group.createdAt} /></td>
      </tr>
    })}
    </tbody>
  </Table>
}

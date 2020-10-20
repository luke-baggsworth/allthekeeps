import {Table} from "../../components/Table";
import {InfoTooltip} from "../../components/InfoTooltip";
import {Hash} from "../../components/Address";
import {getGroupName} from "../Beacon/GroupName";
import {ETHTag} from "../../components/CurrencyTags";
import {ETHValue} from "../../components/ETHValue";
import {TimeToNow} from "../../components/FormattedTime";
import React from "react";
import { useTranslation } from 'react-i18next';

export function BeaconGroupsTable(props: {
  memberships: any,
}) {
  const {memberships} = props;
  const { t } = useTranslation();

  return <Table
      style={{width: '100%'}}>
    <thead>
    <tr>
      <th>
        {t('operator$.beacon_table.group')}
      </th>
      <th>
        {t('operator$.beacon_table.weight')} <InfoTooltip>{t('operator$.beacon_table.weight_tooltip')}</InfoTooltip>
      </th>
      <th>
        {t('operator$.beacon_table.eth_earned')} <InfoTooltip>{t('operator$.beacon_table.eth_earned_tooltip')}</InfoTooltip>
      </th>
      <th>
        {t('operator$.beacon_table.created')}
      </th>
    </tr>
    </thead>
    <tbody>
    {memberships.map((membership: any) => {
      const {group} = membership;
      return <tr key={group.id}>
        <td>
          <Hash hash={group.pubKey} to={`/group/${group.id}`}>{getGroupName(group.id)}</Hash>
        </td>
        <td>
          {membership.count}
        </td>
        <td>
          <ETHTag/> <ETHValue unit={"eth"} wei={membership.reward}/>
        </td>
        <td><TimeToNow time={group.createdAt}/></td>
      </tr>
    })}
    </tbody>
  </Table>
}
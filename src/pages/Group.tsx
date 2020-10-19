import {gql, useQuery} from "@apollo/client";
import React from "react";
import {Paper} from "../design-system/Paper";
import {Helmet} from "react-helmet";
import type {GetRandomBeaconGroupQuery} from "../generated/graphql";
import {useParams} from "react-router";
import {getWeiAsEth} from "../utils/getWeiAsEth";
import {getGroupName} from "./Beacon/GroupName";
import {InfoTooltip} from "../components/InfoTooltip";
import {Hash} from "../components/Address";
import {ETHTag, GweiTag} from "../components/CurrencyTags";
import {ETHValue} from "../components/ETHValue";
import {Table} from "../components/Table";
import {css} from "emotion";
import {Box} from "../components/Box";
import {TimeBetween, TimeToNow} from "../components/FormattedTime";
import {Tab, TabList, TabPanel, Tabs} from "react-tabs";

const BEACONGROUP_QUERY = gql`
    query GetRandomBeaconGroup($id: ID!) {
        randomBeaconGroup(id: $id) {
            id,
            createdAt,
            rewardPerMember,
            memberships(orderBy: count, orderDirection: desc) {
                id,
                count,
                reward,
                operator {
                    address   
                }
            },
            relayEntries(first: 1000, orderBy: requestedAt, orderDirection:desc) {
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
    }
`;


export function BeaconGroup() {
  const {id} = useParams<any>();
  const { loading, error, data } = useQuery<GetRandomBeaconGroupQuery>(BEACONGROUP_QUERY, {variables: {id}});

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :( {""+ error}</p>;

  const group = data!.randomBeaconGroup;
  if (!group) return <p>No such group.</p>;

  return  <div style={{padding: '20px'}}>
    <Helmet>
      <title>Random Beacon Group: {getGroupName(group.id)}</title>
    </Helmet>
    <h1 style={{marginTop: 0, marginBottom: 0}}>
      Random Beacon Group: {getGroupName(group.id)}
    </h1>

    <div className={css`
      display: flex;
      flex-direction: row;
      & > * {
        margin-right: 20px;
      }
  `}>
      <Box
          label={"reward per member"}
      >
        <ETHValue wei={group.rewardPerMember} /> ETH
      </Box>

      <Box
          label={"created"}
      >
        <TimeToNow time={group.createdAt} />
      </Box>

    </div>

    <Tabs>
      <TabList>
        <Tab>
          Members
        </Tab>
        <Tab>
          Entries <InfoTooltip>Entries generated by this group.</InfoTooltip>
        </Tab>
      </TabList>

      <TabPanel>
        <Paper padding>
          <Table
              style={{width: '100%'}}>
            <thead>
            <tr>
              <th>
                Operator
              </th>
              <th>
                Weight <InfoTooltip>An operator can fill multiple membership slots in a group, and will then earn a multiple of rewards.</InfoTooltip>
              </th>
              <th>
                ETH Earned <InfoTooltip>ETH earned by the operator through membership in the group.</InfoTooltip>
              </th>
            </tr>
            </thead>
            <tbody>
            {group.memberships.map((membership: any) => {
              const {group} = membership;
              return <tr key={membership.id}>
                <td>
                  <Hash hash={membership.operator.address} to={`/operator/${membership.operator.address}`} />
                </td>
                <td>
                  {membership.count}
                </td>
                <td>
                  <ETHTag/> <ETHValue unit={"eth"} wei={membership.reward}/>
                </td>
              </tr>
            })}
            </tbody>
          </Table>
        </Paper>
      </TabPanel>

      <TabPanel>
        <Paper padding>
          <Table
              style={{width: '100%'}}>
            <thead>
            <tr>
              <th>
                Requested At
              </th>
              <th>
                Provided After
              </th>
              <th>
                Reward <InfoTooltip>ETH earned by each member of the group providing this value.</InfoTooltip>
              </th>
              <th>
                Random Value
              </th>
              <th>Request ID</th>
            </tr>
            </thead>
            <tbody>
            {(group as any).relayEntries.map((entry: any) => {
              return  <tr key={entry.id}>
                <td><TimeToNow time={entry.requestedAt} /></td>
                <td>
                  <TimeBetween earlier={entry.requestedAt} later={entry.generatedAt} />
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
        </Paper>
      </TabPanel>
    </Tabs>
  </div>
}

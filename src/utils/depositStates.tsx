import { gql } from '@apollo/client';
import React, {useState} from "react";
import {NiceStateLabelFragment} from "../generated/graphql";
import {dateTimeFrom} from "../components/FormattedTime";
import {useInterval} from "./useInterval";

export const NiceStateLabel = gql`
    fragment NiceStateLabel on Deposit {
        currentState,
        bondedECDSAKeep {
            publicKey
        },
        depositSetup {
            failureReason
        },
        currentStateTimesOutAt,
        updatedAt
    }
`;

/**
 * Percentage of the current phase of the deposit that has passed, for example, 50% until AWAITING_BTC_FUNDING
 * times out. Returns `undefined` if the current state does not expire.
 */
export function getTimeRemaining(deposit: NiceStateLabelFragment) {
  if (!deposit.currentStateTimesOutAt) { return; }

  const updatedAt = dateTimeFrom(deposit.updatedAt);
  const currentStateTimesOutAt = dateTimeFrom(deposit.currentStateTimesOutAt);

  const {seconds: totalSeconds} = currentStateTimesOutAt.diff(updatedAt, ['seconds']);
  const {seconds: secondsNow} = currentStateTimesOutAt.diffNow(['seconds']);
  const percentage = Math.min(1 - (secondsNow / totalSeconds), 1);

  return {remaining: secondsNow, total: totalSeconds, percentage};
}

/**
 * Self-updating hook version of `getTimeRemaining()`.
 */
export function useTimeRemaining(deposit: NiceStateLabelFragment, interval?: number) {
  const [value, setValue] = useState(getTimeRemaining(deposit));
  useInterval(() => {
    setValue(getTimeRemaining(deposit));
  }, (interval ?? 0.8) * 1000)
  return value;
}


export function getNiceStateLabel(deposit: NiceStateLabelFragment) {
  const {currentState: state, depositSetup} = deposit;
  const failedSetupReason = depositSetup?.failureReason || "";

  if (state == 'AWAITING_SIGNER_SETUP' && deposit.bondedECDSAKeep?.publicKey) {
    return "$$utils.state_label.awaiting_funding";
  }

  if (state == 'FAILED_SETUP' && failedSetupReason) {
    return ({
      'FUNDING_TIMEOUT': '$$utils.state_label.funding_timeout',
      'SIGNER_SETUP_FAILED_DEPOSITOR': '$$utils.state_label.funding_timeout',
      'SIGNER_SETUP_FAILED': '$$utils.state_label.signer_setup_failed',
    } as any)[failedSetupReason] || "$$utils.state_label.setup_failed";
  }

  return ({
    'AWAITING_SIGNER_SETUP': "$$utils.state_label.awaiting_signer_setup",
    'AWAITING_BTC_FUNDING_PROOF': "$$utils.state_label.awaiting_funding_proof",
    'AWAITING_WITHDRAWAL_SIGNATURE': '$$utils.state_label.awaiting_withdrawal_signature',
    'AWAITING_WITHDRAWAL_PROOF': '$$utils.state_label.awaiting_withdrawal_proof',
    'REDEEMED': '$$utils.state_label.redeemed',
    'ACTIVE': "$$utils.state_label.active",
    'FAILED_SETUP': "$$utils.state_label.setup_failed",
    "LIQUIDATED": "$$utils.state_label.liquidated",
    "LIQUIDATION_IN_PROGRESS": "$$utils.state_label.liquidation_in_progress"
  } as any)[state || ""] || state;
}

export function getStateBoxStyle(state: string) {
  let inProgress = '#ffb74d';
  let failed = '#F44336';
  let redeemed = 'silver';
  let active = '#4caf50';

  const color = ({
    'AWAITING_SIGNER_SETUP': inProgress,
    'AWAITING_BTC_FUNDING_PROOF': inProgress,
    'AWAITING_WITHDRAWAL_SIGNATURE': inProgress,
    'AWAITING_WITHDRAWAL_PROOF': inProgress,
    'REDEEMED': redeemed,
    'ACTIVE': active,
    'FAILED_SETUP': 'transparent',
    "LIQUIDATED": failed,
    "LIQUIDATION_IN_PROGRESS": inProgress
  } as any)[state] || "transparent";

  const borderColor = ({
    'FAILED_SETUP': failed,
  } as any)[state] || color;

  return {
    backgroundColor: color,
    border: `1px solid ${borderColor}`
  };
}

export function getStateTooltip(state: string) {
  const text = ({
    'REDEEMED': "$$utils.state_tooltip.redeemed",
    "LIQUIDATION_IN_PROGRESS": "$$utils.state_tooltip.liquidation_in_progress"
  } as any)[state] || "$$utils.state_tooltip.default";

  return text;
}
import {DateTime} from "luxon";
import {gql, useQuery} from "@apollo/client";
import {NiceStateLabel} from "../../utils/depositStates";
import {useQueryWithTimeTravel} from "../../TimeTravel";

export type DepositViewID =
    ''
    | 'active'
    | 'liquidations'
    | 'redeemable'
    | 'unminted'
    | 'operations'
    | 'redemptions'
    | 'notifiable';


export const Views: {
  id: DepositViewID,
  label: string,
  description: string,
  title?: string,
  action?: "make"
}[] = [
  {
    id: "",
    label: "deposits.views.all_deposits",
    description: "deposits.views.all_deposits_desc",
    title: "Deposits",
    action: "make"
  },

  {
    id: "operations",
    label: "deposits.views.deposit_operations",
    description: "deposits.views.deposit_operations_desc",
    action: "make"
  },

  {
    id: "redemptions",
    label: "deposits.views.redemption_operations",
    description: "deposits.views.redemption_operations_desc"
  },

  {
    id: "liquidations",
    label: "deposits.views.liquid_and_singer",
    description: "deposits.views.liquid_and_singer_desc"
  },

  {
    id: "redeemable",
    label: "deposits.views.redeemable",
    description: "deposits.views.redeemable_desc"
  },

  {
    id: "unminted",
    label: "deposits.views.unminted_TDTs",
    description: "deposits.views.unminted_TDTs_desc"
  },

  {
    id: "notifiable",
    label: "deposits.views.notifiable_deposits",
    description: "deposits.views.notifiable_deposits_desc"
  },
]


const DEPOSITS_QUERY = gql`
    query GetDeposits($where: Deposit_filter, $orderBy: Deposit_orderBy, $skip: Int, $block: Block_height) {
        deposits(
            first: 500,
            skip: $skip,
            orderBy: $orderBy,
            orderDirection: desc
            where: $where,
            block: $block
        ) {
            id,
            contractAddress,
            lotSizeSatoshis,
            currentState,
            keepAddress,
            updatedAt,
            createdAt,
            redemptionStartedAt,
            currentStateTimesOutAt

            tdtToken {
                owner
            }

            #            endOfTerm,
            # you can redeem it if: you are the owner, it is at term, is in courtesy call
            # thus the status is:  
            # canBeRedeemedByAnyone = CourtesyFlag || atTerm

            undercollateralizedThresholdPercent,
            severelyUndercollateralizedThresholdPercent,
            bondedECDSAKeep {
                id,
                totalBondAmount,
                publicKey
            }

            ...NiceStateLabel
        }
        stats: statsRecord(id: "current") {
            depositCount
        }
    }

    ${NiceStateLabel}
`;

export function useDepositQuery(view: DepositViewID, pageNumber?: number) {
  const where = ({
    "": {},
    active: {'filter_activeLikeState': true},
    liquidations: {'filter_liquidationLikeOrSignerFailureState': true},
    redeemable: {'filter_redeemableAsOf_gt': Math.round(DateTime.utc().toMillis() / 1000)},
    unminted: {'filter_unmintedTDT': true},
    notifiable: {'currentStateTimesOutAt_lt': Math.round(DateTime.utc().toMillis() / 1000)},
    redemptions: {'redemptionStartedAt_not': null},
  } as any)[view || ''] || {};

  const dateColumn: string = ({
    "": "updatedAt",
    operations: "createdAt",
    redemptions: "redemptionStartedAt",
  } as {[key in DepositViewID]: string})[view || ''] || "updatedAt";

  const perPage = 500;

  const {loading, error, data} = useQueryWithTimeTravel(DEPOSITS_QUERY, {
    variables: {
      where: where,
      orderBy: dateColumn,
      skip: perPage * ((pageNumber ?? 1) - 1)
    }
  });

  return {loading, error, data, dateColumn, view};
}

export type UseDepositQuery = ReturnType<typeof useDepositQuery>;
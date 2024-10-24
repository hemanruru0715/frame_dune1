import { getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { init, validateFramesMessage } from '@airstack/frames';
import { getFarcasterUserDetails, FarcasterUserDetailsInput, FarcasterUserDetailsOutput } from '@airstack/frames';
import { fetchQuery } from "@airstack/node";
import { NEXT_PUBLIC_URL } from '@/app/config';
import { config } from "dotenv";
import { fetchUserData, updateInsertUserData, updateInsertUserDataForChart } from '@/app/utils/supabase';
import axios from "axios";
import { gql, GraphQLClient } from "graphql-request";
import resolveFidToAddresses from "@/app/utils/resolve";

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export const dynamic = 'force-dynamic';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  try {

    const body = await req.json();

    config();
    const apiKey = process.env.NEXT_PUBLIC_AIRSTACK_API_KEY ?? "default_api_key";
    init(apiKey ?? "");

    //프레임유효성검사
    const { isValid, message } = await validateFramesMessage(body);
    if (!isValid) {
      return new NextResponse('Message not valid', { status: 500 });
    }
    let myFid = Number(message?.data?.fid) || 0;
    //let myFid = 317777;
    const input: FarcasterUserDetailsInput = { fid: myFid };

    // const dune = new DuneClient("6aaWmtf4mB0R3ssj2o2Mu54xmrWVTcOl");
    // const query_result = await dune.getLatestResult({queryId: 4181252});

    // console.log("query_result=" + JSON.stringify(query_result));

    const options: RequestInit = {
      method: 'GET',
      headers: {
        'X-DUNE-API-KEY': process.env.X_DUNE_API_KEY ?? ""
      }
    };
    
    const queryParams = new URLSearchParams({
       limit: '1000', 
       offset: '0',
       filters: "user1 = '" + myFid + "' OR user2 = '" + myFid + "'",
       sort_by: "total_tip_amount desc"
      });  

    const queryId = '4196350';
    const url = `https://api.dune.com/api/v1/query/${queryId}/results?${queryParams.toString()}`;
    
    fetch(url, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json() as Promise<any>;  // JSON 응답을 반환하는 것으로 타입 지정
      })
      .then((data) => console.log("duneData=" + JSON.stringify(data)))
      .catch((err) => console.error(err));


    //파캐스터 유저정보
    //const { data, error }: FarcasterUserDetailsOutput = await getFarcasterUserDetails(input);
    //console.warn("getFarcasterUserDetails=" + JSON.stringify(data));
    //if (error) throw new Error(error);

   const socialCapitalQuery = `
          query MyQuery {
            Socials(
              input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "` + myFid + `"}}, blockchain: ethereum}
            ) {
              Social {
                farcasterScore {
                  farScore
                  farBoost
                  farRank
                  tvl
                  tvlBoost
                  liquidityBoost
                  powerBoost
                }
                profileDisplayName
                profileName
                userId
                profileImage
                profileImageContentValue {
                  image {
                    medium
                  }
                }
              }
            }
            FarcasterMoxieClaimDetails(
              input: {filter: {fid: {_eq: "` + myFid + `"}}, blockchain: ALL}
            ) {
              FarcasterMoxieClaimDetails {
                availableClaimAmount
                availableClaimAmountInWei
              }
            }              
            today: FarcasterMoxieEarningStats(
              input: {filter: {entityType: {_eq: USER}, entityId: {_eq: "` + myFid + `"}}, timeframe: TODAY, blockchain: ALL}
            ) {
              FarcasterMoxieEarningStat {
                allEarningsAmount
              }
            }
            weekly: FarcasterMoxieEarningStats(
              input: {filter: {entityType: {_eq: USER}, entityId: {_eq: "` + myFid + `"}}, timeframe: WEEKLY, blockchain: ALL}
            ) {
              FarcasterMoxieEarningStat {
                allEarningsAmount
              }
            }
            allTime: FarcasterMoxieEarningStats(
              input: {filter: {entityType: {_eq: USER}, entityId: {_eq: "` + myFid + `"}}, timeframe: LIFETIME, blockchain: ALL}
            ) {
              FarcasterMoxieEarningStat {
                allEarningsAmount
              }
            }
          }
       `;

    const quoteRecastsQuery = `
        query MyQuery {
          quoteRecasts: FarcasterQuotedRecasts(
            input: {filter: {recastedBy: {_eq: "fc_fid:`+ myFid +`"}}, blockchain: ALL}
          ) {
            QuotedRecast {
              castedAtTimestamp
              url
            }
          }
        }
      `;

      /* 팬토큰 TVL 스테이킹,언스테이킹 */
      const graphQLClient = new GraphQLClient(
        "https://api.studio.thegraph.com/query/23537/moxie_protocol_stats_mainnet/version/latest"
      );

      const query = gql`
        query MyQuery($userAddresses: [ID!]) {
          users(where: { id_in: $userAddresses }) {
            portfolio {
              stakedBalance
              unstakedBalance
              buyVolume
              sellVolume
              subjectToken {
                currentPriceInMoxie
                name
                symbol
              }
            }
          }
        }
      `;

      const variable = {
        // You can remove await if you are using `moxie_resolve.json`
        userAddresses: await resolveFidToAddresses(myFid),
      };


    let profileName = '';
    let profileImage = '';
    let farScore = 0;
    let farBoost = 0;
    let farRank = 0;
    let tvl = 'N/A';
    let tvlBoost = 0;
    let liquidityBoost = 0;
    let powerBoost = 0;
    let availableClaimAmount = 0;

    let stakedTvl = 0;
    let unStakedTvl = 0;

    let todayAmount = 0;
    let weeklyAmount = 0;
    let lifeTimeAmount = 0;
    
    let likeCount = 0;
    let replyCount = 0;
    let recastCount = 0;
    let quoteCount = 0;

     // 데이터 처리 함수 호출 후 그 결과를 기다림
    await main(myFid, socialCapitalQuery, quoteRecastsQuery);

    //const main = async () => {
    async function main(myFid: number, socialCapitalQuery: string, quoteRecastsQuery: string) {
      const server = "https://hubs.airstack.xyz";
      try {
        // API 요청을 병렬로 실행
        const [socialCapitalQueryData, castsResponse, reactionsResponse, quoteRecastsQueryData] = await Promise.all([
          fetchQuery(socialCapitalQuery),

          axios.get(`${server}/v1/castsByFid?fid=`+ myFid +`&pageSize=400&reverse=true`, {
            headers: {
              "Content-Type": "application/json",
              "x-airstack-hubs": apiKey as string,
            },
          }),

          axios.get(`${server}/v1/reactionsByFid?fid=`+ myFid +`&reaction_type=REACTION_TYPE_RECAST&pageSize=200&reverse=true`, {
            headers: {
              "Content-Type": "application/json",
              "x-airstack-hubs": apiKey as string,
            },
          }),

          fetchQuery(quoteRecastsQuery)
        ]);

        //5개 병렬시 오류가 자주나서 4개,1개로 병렬처리 분리
        const [likesResponse, stakingData] = await Promise.all([
            axios.get(`${server}/v1/reactionsByFid?fid=`+ myFid +`&reaction_type=REACTION_TYPE_LIKE&pageSize=999&reverse=true`, {
              headers: {
                "Content-Type": "application/json",
                "x-airstack-hubs": apiKey as string,
              },
            }),

            graphQLClient.request(query, variable)
          ]);


        //socialCapitalQueryData
        const data = socialCapitalQueryData.data;
        
        //console.warn("data=" + JSON.stringify(data));
        profileName = data.Socials.Social[0].profileName;
        profileImage = data.Socials.Social[0].profileImage;
        farScore = data.Socials.Social[0].farcasterScore.farScore.toFixed(3);
        farBoost = data.Socials.Social[0].farcasterScore.farBoost.toFixed(3);
        farRank = data.Socials.Social[0].farcasterScore.farRank.toFixed(0);
        tvl = (Number(data.Socials.Social[0].farcasterScore.tvl) / 1e18).toFixed(1); //실제 저장된 tvl목시개수는 10^18로 나눈다. 그다음 api/og로 전달. 넘겨서 다시 K표시위해 3으로 추가 나누기
        tvlBoost = data.Socials.Social[0].farcasterScore.tvlBoost.toFixed(2);
        liquidityBoost = data.Socials.Social[0].farcasterScore.liquidityBoost.toFixed(2);
        powerBoost = data.Socials.Social[0].farcasterScore.powerBoost.toFixed(2);
        availableClaimAmount = data.FarcasterMoxieClaimDetails.FarcasterMoxieClaimDetails[0].availableClaimAmount.toFixed(2);

        todayAmount = data.today.FarcasterMoxieEarningStat[0].allEarningsAmount.toFixed(2);
        weeklyAmount = data.weekly.FarcasterMoxieEarningStat[0].allEarningsAmount.toFixed(2);
        lifeTimeAmount = data.allTime.FarcasterMoxieEarningStat[0].allEarningsAmount.toFixed(2);


        console.warn("stakingData=" + JSON.stringify(stakingData));

        type Token = {
          stakedBalance: string;
          unstakedBalance: string;
          buyVolume: string;
          sellVolume: string;
          subjectToken: {
            currentPriceInMoxie: string;
            name: string;
            symbol: string;
          };
        };
        
        type User = {
          portfolio: Token[];
        };
        
        type stakingData = {
          users: User[];
        };

        const totalStakedBalance = (stakingData as stakingData).users.reduce((total, user) => {
          const userTotal  = user.portfolio.reduce((sum, token) => {

              let stakedBalance = Number(token.stakedBalance)/1e18;
              let unstakedBalance = Number(token.unstakedBalance)/1e18;
              let currentPriceInMoxie = Number(Number(token.subjectToken.currentPriceInMoxie).toFixed(2));

              let stakedTvl = stakedBalance * currentPriceInMoxie;
              let unStakedTvl = unstakedBalance * currentPriceInMoxie;

              return {
                staked: sum.staked + stakedTvl,
                unStaked: sum.unStaked + unStakedTvl,
              };
          }, { staked: 0, unStaked: 0 });
          
          return {
            staked: total.staked + userTotal.staked,
            unStaked: total.unStaked + userTotal.unStaked,
          };
        }, { staked: 0, unStaked: 0 });

        stakedTvl = totalStakedBalance.staked;
        unStakedTvl = totalStakedBalance.unStaked;

        console.warn("stakedTvl=" + stakedTvl);
        console.warn("unStakedTvl=" + unStakedTvl);

        console.warn("tvl=" + (Number(tvl) / 1e18).toFixed(1));
        console.warn("tvlBoost=" + tvlBoost);
        console.warn("liquidityBoost=" + liquidityBoost);
        console.warn("powerBoost=" + powerBoost);
        console.warn("availableClaimAmount=" + availableClaimAmount);


        // 날짜 계산 로직
        const referenceDate = new Date(Date.UTC(2021, 0, 1, 0, 0, 0));
        const todayDate = new Date();
        todayDate.setUTCHours(0, 0, 0, 0);

        console.log("111referenceDate=" + referenceDate);
        console.log("111todayDate=" + todayDate);

        const differenceInMillis = todayDate.getTime() - referenceDate.getTime();
        const differenceInSeconds = Math.floor(differenceInMillis / 1000);

        console.log("differenceInMillis=" + differenceInMillis);
        console.log("differenceInSeconds=" + differenceInSeconds);

        //console.warn("castsResponse=" + JSON.stringify(castsResponse.data));

        // castsResponse에서 reply 메시지 필터링
        const filteredReplyMessages = castsResponse.data.messages.filter(
          (message: { data: { castAddBody: {parentCastId: any }; 
                              timestamp: any } }
          ) => message.data.castAddBody !== undefined && message.data.castAddBody.parentCastId && message.data.timestamp > differenceInSeconds
        );
        //console.warn("filteredReplyMessages=" + JSON.stringify(filteredReplyMessages));
        replyCount = filteredReplyMessages.length;
        console.warn("replyCount=" + replyCount);
    

        // likesResponse에서 like 메시지 필터링
        const filteredLikeMessages = likesResponse.data.messages.filter(
          (message: { data: { timestamp: any } }) =>
            message.data.timestamp > differenceInSeconds
        );
        //console.warn("filteredRecastMessages=" + JSON.stringify(filteredRecastMessages));
        likeCount = filteredLikeMessages.length;
        console.warn("likeCount=" + likeCount);


        // reactionsResponse에서 recast 메시지 필터링
        const filteredRecastMessages = reactionsResponse.data.messages.filter(
          (message: { data: { timestamp: any } }) =>
            message.data.timestamp > differenceInSeconds
        );
        //console.warn("filteredRecastMessages=" + JSON.stringify(filteredRecastMessages));
        recastCount = filteredRecastMessages.length;
        console.warn("recastCount=" + recastCount);


        // quoteRecastsQueryData에서 quote 메시지 필터링
        const todayStart = new Date().setUTCHours(0, 0, 0, 0);
        console.warn("todayStart=" + todayStart);
        //console.warn("quoteRecastsQueryData=" + JSON.stringify(quoteRecastsQueryData));
        const filteredQuoteMessages = quoteRecastsQueryData.data.quoteRecasts.QuotedRecast.filter(
          (  item: { castedAtTimestamp: string | number | Date; }) => {
              const castedAt = new Date(item.castedAtTimestamp).getTime();
              return castedAt >= todayStart;
          });


        //console.warn("filteredQuoteMessages=" + JSON.stringify(filteredQuoteMessages));
        quoteCount = filteredQuoteMessages.length;
        console.warn("quoteCount=" + quoteCount);

      } catch (e) {
        console.error(e);
      }
    };



    //이미지URL 인코딩처리
    const encodedProfileImage = encodeURIComponent(profileImage);

    /**************** DB 작업 ****************/
    // DB에 업데이트 또는 삽입
    await updateInsertUserData({
      fid: myFid,
      profile_name: profileName,
      profile_image: profileImage,
      far_score: farScore,
      far_boost: farBoost,
      far_rank: farRank,
      today_amount: todayAmount,
      weekly_amount: weeklyAmount,
      lifetime_amount: lifeTimeAmount,
      reply_count: replyCount,
      like_count: likeCount,
      recast_count: recastCount,
      quote_count: quoteCount,
      tvl: tvl,
      tvl_boost: tvlBoost,
      liquidity_boost: liquidityBoost,
      power_boost: powerBoost,
      available_claim_amount: availableClaimAmount,
      staked_tvl: stakedTvl,
      unstaked_tvl: unStakedTvl,
    });


    await updateInsertUserDataForChart({
      fid: myFid,
      profile_name: profileName,
      far_rank: farRank,
      available_claim_amount: availableClaimAmount,
    });
    /**************** DB 작업 끝 ****************/

    const frameUrl = `${NEXT_PUBLIC_URL}/api/frame?fid=${myFid}&cache_burst=${Math.floor(Date.now() / 1000)}`;

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          { 
            label: 'MyStats/🔎' 
          },
          { 
            action: 'link', 
            label: '🔄Share', 
            target: `https://warpcast.com/~/compose?text=Check your Moxie Stats. Frame created by @hemanruru&embeds%5B%5D=${encodeURIComponent(frameUrl)}`
          },
          {
            action: 'link', 
            label: '@sinbiro', 
            target: 'https://warpcast.com/hemanruru' 
          },
        ],
        image: { 
          src: `${NEXT_PUBLIC_URL}/api/og?profileName=${profileName}&fid=${myFid}&profileImage=${encodedProfileImage}
                                         &farScore=${farScore}&farBoost=${farBoost}&farRank=${farRank}
                                         &todayAmount=${todayAmount}&weeklyAmount=${weeklyAmount}&lifeTimeAmount=${lifeTimeAmount}
                                         &replyCount=${replyCount}&likeCount=${likeCount}&recastCount=${recastCount}&quoteCount=${quoteCount}
                                         &tvl=${tvl}&tvlBoost=${tvlBoost}&liquidityBoost=${liquidityBoost}&powerBoost=${powerBoost}
                                         &stakedTvl=${stakedTvl}&unStakedTvl=${unStakedTvl}
                                         &availableClaimAmount=${availableClaimAmount}
                                         &cache_burst=${Math.floor(Date.now() / 1000)}`,
          aspectRatio: '1:1',
        },
        postUrl: `${NEXT_PUBLIC_URL}/api/frame?cache_burst=${Math.floor(Date.now() / 1000)}`,
        //state: { time: new Date().toISOString() },
      })
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}


export async function GET(req: NextRequest) {
  // Next.js의 NextRequest 객체에서 URL과 쿼리 매개변수를 직접 가져옵니다.
  const url = req.nextUrl; // NextRequest의 nextUrl 속성 사용
  const fid = Number(url.searchParams.get('fid')); // 'fid' 매개변수 추출

  console.log("Extracted FID:", fid);

  // frameData의 타입 정의
  interface FrameData {
    fid: number;
    profile_name: string;
    profile_image: string;
    far_score: number;
    far_boost: number;
    far_rank: number;
    today_amount: number;
    weekly_amount: number;
    lifetime_amount: number;
    reply_count: number;
    like_count: number;
    recast_count: number;
    quote_count: number;
    tvl: number,
    tvl_boost: number,
    liquidity_boost: number,
    power_boost: number,
    available_claim_amount: number,
    staked_tvl: number,
    unstaked_tvl: number,
  }

  /**************** DB 작업 ****************/
  const data = await fetchUserData(fid);
  if (!data) {
    return new NextResponse('No data found', { status: 404 });
  }
  console.log("api/frame/route.ts_data=" + JSON.stringify(data));
  /**************** DB 작업 끝 ****************/

  const frameData: FrameData = {
    fid: data.fid,
    profile_name: data.profile_name,
    profile_image: data.profile_image,
    far_score: data.far_score,
    far_boost: data.far_boost,
    far_rank: data.far_rank,
    today_amount: data.today_amount,
    weekly_amount: data.weekly_amount,
    lifetime_amount: data.lifetime_amount,
    reply_count: data.reply_count,
    like_count: data.like_count,
    recast_count: data.recast_count,
    quote_count:  data.quote_count,
    tvl:  data.tvl,
    tvl_boost:  data.tvl_boost,
    liquidity_boost:  data.liquidity_boost,
    power_boost: data.power_boost,
    available_claim_amount:  data.available_claim_amount,
    staked_tvl: data.staked_tvl,
    unstaked_tvl: data.unstaked_tvl,
  };

  const profileImage = encodeURIComponent(frameData.profile_image);
  const frameUrl = `${NEXT_PUBLIC_URL}/api/frame?fid=${frameData.fid}&cache_burst=${Math.floor(Date.now() / 1000)}`;

  console.log("api/frame/route.frameData=" + JSON.stringify(frameData));

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        { 
          label: 'MyStats/🔎' 
        },
        { 
          action: 'link', 
          label: '🔄Share', 
          target: `https://warpcast.com/~/compose?text=Check your Moxie Stats. Frame created by @hemanruru&embeds%5B%5D=${encodeURIComponent(frameUrl)}`
        },
        {
          action: 'link', 
          label: '@sinbiro', 
          target: 'https://warpcast.com/hemanruru' 
        },
      ],
      image: { 
        src: `${NEXT_PUBLIC_URL}/api/og?profileName=${frameData.profile_name}&fid=${frameData.fid}&profileImage=${profileImage}
                                       &farScore=${frameData.far_score}&farBoost=${frameData.far_boost}&farRank=${frameData.far_rank}
                                       &todayAmount=${frameData.today_amount}&weeklyAmount=${frameData.weekly_amount}&lifeTimeAmount=${frameData.lifetime_amount}
                                       &replyCount=${frameData.reply_count}&likeCount=${frameData.like_count}&recastCount=${frameData.recast_count}&quoteCount=${frameData.quote_count}
                                       &tvl=${frameData.tvl}&tvlBoost=${frameData.tvl_boost}&liquidityBoost=${frameData.liquidity_boost}&powerBoost=${frameData.power_boost}
                                       &stakedTvl=${frameData.staked_tvl}&unStakedTvl=${frameData.unstaked_tvl}
                                       &availableClaimAmount=${frameData.available_claim_amount}
                                       &cache_burst=${Math.floor(Date.now() / 1000)}`,
        aspectRatio: '1:1',
      },
      postUrl: `${NEXT_PUBLIC_URL}/api/frame?cache_burst=${Math.floor(Date.now() / 1000)}`,
      //state: { time: new Date().toISOString() },
    })
  );
}

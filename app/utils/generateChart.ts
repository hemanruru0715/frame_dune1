import { createCanvas, registerFont  } from 'canvas';
import Chart from 'chart.js/auto';
import { fetchUserDataRecentSevenDaysForChart } from '@/app/utils/supabase';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // DataLabels 플러그인 가져오기

// 커스텀 폰트 등록 (TrueType Font 파일 경로)
registerFont('./public/fonts/Recipekorea.ttf', { family: 'CustomFont' });

// 최근 14일의 날짜 생성 함수
const getLast14DaysLabels = (): string[] => {
    const today = new Date();
    const last14DaysLabels = [];
    for (let i = 0; i < 14; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        const year = pastDate.getFullYear();
        const month = String(pastDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(pastDate.getDate()).padStart(2, '0');
        last14DaysLabels.unshift(`${year}-${month}-${day}`);
    }
    return last14DaysLabels;
};

const getLast14DaysLabels_MMDD = (): string[] => {
    const today = new Date();
    const last14DaysLabels_MMDD = [];
    for (let i = 0; i < 14; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        const year = pastDate.getFullYear();
        const month = String(pastDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(pastDate.getDate()).padStart(2, '0');
        last14DaysLabels_MMDD.unshift(`${month}-${day}`);
    }
    return last14DaysLabels_MMDD;
};

// 차트 생성 함수
export const generateChart = async (fid: any) => { // async 추가
    // 데이터 가져오기 (비동기 처리)
    const userChartData = await fetchUserDataRecentSevenDaysForChart(fid);

    // record_date_utc 기준으로 오름차순(과거 → 최신) 정렬
    let sortedUserChartData = [];
    if(userChartData != null){
            sortedUserChartData = userChartData.sort((a, b) => {
            return new Date(a.record_date_utc).getTime() - new Date(b.record_date_utc).getTime();
        });
        console.log("sortedUserChartData=" + JSON.stringify(sortedUserChartData));
    }

    // 최근 7일의 날짜 레이블 생성
    let labels = getLast14DaysLabels();

    //console.log("labels=" + JSON.stringify(labels));
    // sortedUserChartData와 labels를 매칭하여 available_claim_amount 값을 채움
    let farRanks = labels.map(label => {
        const entry = sortedUserChartData.find(data => data.record_date_utc.startsWith(label));
        return entry ? entry.far_rank : 0; // 데이터가 없으면 0 반환
    });

    //farRanks=[0,0,0,0,0,0,0,270,251,0,0,0,215,206];
  
    // 최대 랭킹에서 현재 랭킹을 빼는 방식으로 변환
    const maxRankingValue = Math.max(...farRanks); // 현재 데이터에서 최대값 찾기

    let invertedFarRanks = farRanks.map(rank => {
        if (rank > 0) {
            return (maxRankingValue + 50) - rank; // 랭킹을 반대로 변환
        }
        return 0; // 랭킹이 0일 경우 그대로 반환
    });


    console.log("farRanks=" + JSON.stringify(farRanks));
    const minFarRank = Math.min(...farRanks); // 최소값
    const maxFarRank = Math.max(...farRanks); // 최대값

    let labels14 = getLast14DaysLabels_MMDD(); //실제로 x축은 월일만 보여줌

    console.log("labels14=" + JSON.stringify(labels14));

    const canvas = createCanvas(600, 600); // 크기를 더 크게 설정
    const ctx: any = canvas.getContext('2d');

    const chartConfig: any = {
        type: 'bar',
        data: {
            labels: labels14,
            datasets: [
                {
                    //label: 'claim',
                    data: invertedFarRanks,
                    borderColor: '#DC143C', // 선 색상
                    backgroundColor: 'rgba(220, 20, 60, 0.8)', // 채워지는 영역 투명도
                    fill: true, // 영역 차트로 만듬
                    pointBackgroundColor: 'red', // 데이터 포인트 색상
                    pointRadius: 2, // 데이터 포인트 크기
                    tension: 0.0, // 선의 부드러움 조정
                }
            ]
        },
        options: {
            responsive: false,
            animation: false,
            layout: {
                padding: {
                    top: 10,
                    bottom: 250, // X축이 잘리지 않도록 아래쪽에 패딩 추가
                }
            },
            plugins: {
                legend: {
                    display: false, // 범례 표시를 비활성화
                    position: 'top',
                    labels: {
                        color: '#DC143C', // 레전드 텍스트 색상
                        font: {
                            size: 12, // 레전드 텍스트 크기
                        }
                    }
                },
                datalabels: {
                    display: true, // 데이터 레이블 표시
                    color: '#000000', // 레이블 색상
                    font: {
                        size: 14,
                        weight: 'bold',
                        family: 'CustomFont', // 레이블에 폰트 적용
                    },
                    align: 'end', // 막대의 끝에 맞춰 표시
                    anchor: 'end', // 막대의 끝 기준으로 레이블을 붙임
                    offset: 10, // 레이블을 위로 10px 더 이동
                    formatter: (value: number) => {
                        return value !== 0 ?  ((maxRankingValue + 50) - value).toString() : ''; // null이 아닌 값만 표시
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'recent 14 days',
                        color: '#DC143C',
                        font: {
                            size: 14,
                            weight: 'bold',
                            family: 'CustomFont', // Y축에 폰트 적용
                        }
                    },
                    grid: {
                        color: 'rgba(220, 20, 60, 0.3)', // 그리드 선을 흐리게
                        lineWidth: 1, // 그리드 선 두께
                        borderDash: [5, 5], // 점선 스타일
                    },
                    ticks: {
                        color: '#DC143C',
                        font: {
                            size: 14,
                            weight: 'bold', // Y축 값들을 bold로 설정
                        }
                    },
                    border: {
                        color: '#DC143C', // X축 검은색 선
                        width: 2, // X축 선 두께
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Far Rank',
                        color: '#DC143C',
                        font: {
                            size: 14,
                            weight: 'bold',
                            family: 'CustomFont', // Y축에 폰트 적용
                        }
                    },
                    grid: {
                        color: 'rgba(220, 20, 60, 0.3)', // Y축 그리드 선 색상 조정
                        lineWidth: 1, // Y축 그리드 선 두께
                        borderDash: [5, 5], // 점선 스타일
                    },
                    ticks: {
                        color: '#DC143C',
                        font: {
                            size: 14,
                            weight: 'bold', // Y축 값들을 bold로 설정
                        },
                        //stepSize: 7000, // Y축 간격을 100으로 설정
                        beginAtZero: false,
                        display: false
                    },
                    min: minFarRank, // Y축 최소값
                    max: maxFarRank, // Y축 최대값을 45000으로 설정하여 간격 조정
                    reverse: false,
                    border: {
                        color: '#DC143C', // Y축 검은색 선
                        width: 2, // Y축 선 두께
                    }
                }
            }
        },
        plugins: [ChartDataLabels] // DataLabels 플러그인 활성화
    };

    new Chart(ctx, chartConfig);

    return canvas.toBuffer();  // 이미지를 Buffer로 반환
};
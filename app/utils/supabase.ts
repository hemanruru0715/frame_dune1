import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

//개발db, 운영db 분리하기
const supabaseDb = process.env.NODE_ENV == 'development' ? 'user_degen_stats_1_dev' : 'user_degen_stats_1';
const supabase = createClient(supabaseUrl, supabaseKey);


// fid에 해당하는 데이터 가져오기 함수
export const fetchUserData = async (fid: number) => {
    const { data, error } = await supabase
      .from(supabaseDb)
      .select('*')
      .eq('fid', fid);
  
    if (error) {
      if (error.code !== 'PGRST116') { // row가 없는 경우 에러를 제외
        console.error("Supabase 데이터 검색 오류:", error);
        throw new Error('Error fetching data from Supabase');
      }
      return null;
    }
  
    return data;
};

export const insertUserDataArray = async (fid: number, user_rank: number, tip_allowance: number, remaining_tip_allowance: number, 
                                          profile_name: any, profile_image: any, dataArray: any[]) => {
  // 기존 fid에 해당하는 모든 행 삭제
  const { error: deleteError } = await supabase
      .from(supabaseDb)
      .delete()
      .eq('fid', fid);

  if (deleteError) {
      console.error("Supabase 데이터 삭제 오류:", deleteError);
      throw new Error('Error deleting data in Supabase');
  }

  // 데이터를 새로 삽입
  let seq_no = 1;

  for (const dataItem of dataArray) {
      const userData = {
          fid,
          seq_no,
          ...dataItem,
          user_rank,
          tip_allowance,
          remaining_tip_allowance,
          profile_name,
          profile_image,
          reg_dtm: getKoreanISOString()
      };

      //console.warn("Inserting data with seq_no=" + seq_no + ", data=" + JSON.stringify(userData));

      const { error: insertError } = await supabase
          .from(supabaseDb)
          .insert([userData]);

      if (insertError) {
          console.error("Supabase 데이터 삽입 오류:", insertError);
          throw new Error('Error inserting data into Supabase');
      }

      // 다음 항목으로 넘어가며 seq_no 증가
      seq_no++;
  }
};



function getKoreanISOString() {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9 시간대 반영
    return koreanTime.toISOString().slice(0, 19).replace('T', ' ');
}
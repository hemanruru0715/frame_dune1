import data from "./moxie_resolve.json";

const resolveFidToAddresses = (fid: number) => {

    if (!Array.isArray(data)) {
        console.error("Data is not an array");
        return [];
      }
      
      return data.filter((d) => d?.fid === fid)
                 .map((d) => d.address);  // address는 null이나 undefined가 없으므로 ?. 연산자를 제거
};

export default resolveFidToAddresses;
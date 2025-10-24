import { Device } from "../device";
import { DotPadSDK } from "../DotPadSDK-1.0.0";

/*
input:
  - animalName: 찾아볼 이미지의 종류
  - form: 누른 버튼의 종류 (f1, f2, f3)

  output:
  - 없음

  description:
    - 출력하고 싶은 동물 이름(animalName)과 f1, f2 등 누른 버튼(form)에 따라 animal-data.ts에서 알맞는 데이터를 불러와서 dotpadsdk의 displayGraphicData 함수를 호출
*/
const animalPrint = async (hexData: string, devices: Device[], dotpadsdk: DotPadSDK|null, animalIdx:number, formIdx: number) => {
    devices.map(async (device) => {
      // 
      await dotpadsdk?.displayGraphicData(device, hexData);
    });
  };
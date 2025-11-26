import React from "react";
import { useEffect, useRef, useState } from "react";
import { DotPadSDK } from "../DotPadSDK-1.0.0";
import { Device } from "../device";
import { animalList, AnimalData } from "../util/animalData"; // 테스트 데이터를 저장해놓은 곳
import AnimalBlock from "../components/AnimalBlock";
import "../App.css";

import DotPadDisplay from "../components/DotPadDisplay";
import DotPadButtons from "../components/DotPadButtons";


export default function Dictionary() {
  
  const dotpadsdk = useRef<DotPadSDK>(null);
  const [devices, setDevices] = useState<Device[]>([]);

  const [animalIdx, setAnimalIdx] = React.useState<number>(0); // 현재 출력 중인 동물 종의 인덱스 ex) 0:개, 1:고양이, 2:펭귄
  const [buttonName, setButtonName] = React.useState<"f1" | "f2" | "f3" | "f4">("f1"); // 누른 버튼의 종류 ex) f1 ~ f4

  // 그림판에 표시할 데이터 상태 정의 (main : 그림용, sub : 텍스트용)
  const mainDisplayData = AnimalData({animalIdx, buttonName}); // AnimalData: 입력한 인덱스에 알맞는 정보를 반환
  const subDisplayData = "";

  //페이지가 켜질 때 딱 한 번 실행
  useEffect(() => { 
    console.log("Dictionary 페이지 로드됨, SDK 초기화 시작") //디버깅용 로그

    dotpadsdk.current = new DotPadSDK();    // SDK  인스턴스 생성
    console.log("SDK 인스턴스 생성 완료:", dotpadsdk.current);

  }, []);


  // 버튼을 누를 때마다 동물 이미지를 새로 출력
  useEffect(() => {
    if (!devices[0] || !devices[0].connected) return;
    const data = AnimalData({animalIdx, buttonName});
    if (data) {
      handlePrintImage(data);
    }
  }, [animalIdx, buttonName, devices])

  useEffect(() => {
    const targetDevice = devices[0];
    if (!targetDevice || !targetDevice.connected) return;

    const listener = (keycode: string) => {
      console.log('DotPad key event received:', keycode);
      
      // DotPad sends numeric codes: 1, 2, 3, 4 for function keys and 0, 5 for panning
      const mappingFunctionKey: Record<string, "f1" | "f2" | "f3" | "f4"> = {
        "1": "f1",  // F1 버튼
        "2": "f2",  // F2 버튼
        "3": "f3",  // F3 버튼
        "4": "f4"   // F4 버튼
      }
      const mappingArrowKey: Record<string, "prev" | "next"> = {
        "0": "prev", // Left/Previous
        "5": "next"  // Right/Next
      }
      
      if (["1", "2", "3", "4"].includes(keycode)) {
        console.log("function key 입력:", keycode);
        const fn = mappingFunctionKey[keycode];
        if (fn) {
          console.log("Executing function button click:", fn);
          onFunctionButtonClick(fn);
        }
      } else if (["0", "5"].includes(keycode)) {
        console.log("arrow key 입력:", keycode);
        const dir = mappingArrowKey[keycode];
        if (dir) {
          console.log("Executing arrow button click:", dir);
          onArrowButtonClick(dir);
        }
      } else {
        console.log("Unknown keycode:", keycode);
      }
    };

    console.log('Adding key event listener for device:', targetDevice.name);
    dotpadsdk.current?.addListenerKeyEvent(targetDevice.target, listener);

    return () => {
      console.log('Cleaning up key event listener for device:', targetDevice.name);
      // Clean up listener on unmount or device change
      if (dotpadsdk.current && (dotpadsdk.current as any).removeListenerKeyEvent) {
        try {
          (dotpadsdk.current as any).removeListenerKeyEvent(targetDevice.target, listener);
        } catch (e) {
          // ignore if SDK doesn't support removal
        }
      }
    };
  }, [devices]);
  

  // f1 ~ f4 버튼을 눌렀을 때의 행동을 정의해놓은 함수
  const onFunctionButtonClick = (buttonName: "f1" | "f2" | "f3" | "f4") => {
    setButtonName(buttonName);
  }

  
  // 좌(prev), 우(next) 화살표를 눌렀을 때의 행동을 정의해놓은 함수
  const onArrowButtonClick = (buttonName: "prev" | "next") => {
    if (buttonName === "prev") {
      setAnimalIdx((x) => (x-1+animalList.length)%animalList.length)
    } else {
      setAnimalIdx((x) => (x+1)%animalList.length)
    }
  };


  // 그래픽 출력 테스트 함수
  const handlePrintImage = async (mainDisplayData: string) => {
    console.log("이미지 출력");
    const targetDevice = devices[0];
    
    // 데이터 유효성 검사
    if (!mainDisplayData || typeof mainDisplayData !== 'string') {
      console.warn("Invalid mainDisplayData:", mainDisplayData);
      return;
    }
    
    //****** 실제 패드 연결시 사용할 부분 *****
    if (dotpadsdk.current && targetDevice && targetDevice.connected) {
      try {
        //Test.tsx의 이미지 출력 함수 사용
        await dotpadsdk.current.displayGraphicData(targetDevice, mainDisplayData); // SDK text 출력 코드
      } catch (error) {
        console.error("SDK error:", error);
        handlePrintError();
      }
    } else {
      handlePrintError();
    }

  };


  // 설명글 출력 테스트 함수
  const handlePrintText = async () =>  {
    console.log("펭귄 설명글 출력");
    const targetDevice = devices[0];
    
    //****** 실제 패드 연결시 사용할 부분 *****
    if (dotpadsdk.current && targetDevice) {
      //Test.tsx의 설명글 출력 함수 사용
      await dotpadsdk.current?.displayTextData(targetDevice, subDisplayData); // SDK text 출력 코드

    } else {
      handlePrintError();
    }

  };
  

  const handlePrintError = () => {
    console.error("기기를 못 찾음");
    //alert("기기를 먼저 연결하세요.")
  }


// --------------test.tsx 에서 필요한 함수 가져옴------------------

  const updateDeviceConnection = async (device: any, connected: any) => {
    if (connected) {
      console.log('Attempting to connect to device:', device.name);
      const isConnected = await dotpadsdk.current?.connect(device.target);
      console.log('Connection result:', isConnected);
      if (isConnected) {
        console.log('Device connected successfully:', device.name);
        // Listener will be added by the useEffect hook
      } else {
        console.error('Failed to connect to device:', device.name);
        return; // Don't update state if connection failed
      }
    } else {
      console.log('Disconnecting from device:', device.name);
      await dotpadsdk.current?.disconnect(device.target);
    }
    setDevices((devices) =>
      devices.map((d) => (d.name === device.name ? { ...d, connected } : d))
    ); // 객체에서 connected만 변경
  };

  // Function to select a DotPad device
  const handleSelectDevice = async () => {
    const device = await dotpadsdk.current?.request(); // 브라우저 창을 띄워서 DotPad 블루투스 장치를 선택하게 한 다음, 선택된 장치 객체를 반환
    const deviceInfo = {
      target: device,
      name: device.name,
      connected: false,
    };
    setDevices((currentDevices) => [...currentDevices, deviceInfo]);
  };
 
  // DotPad function key callback (for debugging)
  const dotpadKeyCallback = async (keyCode: string) => {
    console.log("=> dotpad key code (debug): " + keyCode);
  };
//----------------------------------------------------------------------

// UI 출력 부분 ---------------------------------------------------------
  return (
      <div className="App">
        <h2>Dot Pad Display Test</h2>
          <div className="buttonContainer">
            <button className="selectButton" onClick={handleSelectDevice}>
              Select DotPad
            </button>
          </div>
          <table className="table">
        <thead>
          <tr>
            <th className="header">DotPad Name</th>
            <th className="header">Connect/Disconnect</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.name} className="row">
              <td className="cell">{device.name}</td>
              <td className="cell">
                {!device.connected && (
                  <button
                    className="button"
                    onClick={() => updateDeviceConnection(device, true)}
                  >
                    Connect
                  </button>
                )}
                {device.connected && (
                  <button
                    className="button"
                    onClick={() => updateDeviceConnection(device, false)}
                  >
                    Disconnect
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        <DotPadDisplay mainData={mainDisplayData} subData={subDisplayData} />
        <DotPadButtons onArrowButtonClick={onArrowButtonClick} onFunctionButtonClick={onFunctionButtonClick} />
        {/* AnimalBlock이 업데이트 되어 음성 기능이 추가되었습니다. */}
        <AnimalBlock animalIdx={animalIdx} buttonName={buttonName} />
      </div>
    );
}
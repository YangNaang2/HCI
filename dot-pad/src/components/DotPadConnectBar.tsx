
import { DotPadSDK } from "../DotPadSDK-1.0.0";
import { Device } from "../device";

import React from "react";

interface DotPadConnectBarProps {
  dotpadsdk: React.RefObject<DotPadSDK | null>;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
}

export default function DotPadConnectBar({ dotpadsdk, devices, setDevices }: DotPadConnectBarProps) {


    const handleSelectDevice = async () => {
      const device = await dotpadsdk.current?.request(); // 브라우저 창을 띄워서 DotPad 블루투스 장치를 선택하게 한 다음, 선택된 장치 객체를 반환
      const deviceInfo = {
        target: device,
        name: device.name,
        connected: false,
      };
      setDevices((currentDevices) => [...currentDevices, deviceInfo]);
    };

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

    return (
        <div>
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
        </div>
    )
}

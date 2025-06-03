import React, { createContext, useContext, useState, ReactNode } from "react";
import { StopMonitoringResultType } from "./MidArea_Monitoring";

interface StopMonitoringResultContextType {
  stopResult: StopMonitoringResultType | null;
  setStopResult: (result: StopMonitoringResultType | null) => void;
}

const StopMonitoringResultContext = createContext<
  StopMonitoringResultContextType | undefined
>(undefined);

export const StopMonitoringResultProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [stopResult, setStopResult] = useState<StopMonitoringResultType | null>(
    null
  );
  return (
    <StopMonitoringResultContext.Provider value={{ stopResult, setStopResult }}>
      {children}
    </StopMonitoringResultContext.Provider>
  );
};

export const useStopMonitoringResult = () => {
  const context = useContext(StopMonitoringResultContext);
  if (!context)
    throw new Error(
      "useStopMonitoringResult must be used within StopMonitoringResultProvider"
    );
  return context;
};

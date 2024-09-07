/* eslint-disable */
declare var NAF: {
  InterpolationBuffer: any;
  clientId: string;
  connection: {
    adapter?: {
      enableMicrophone: (enabled: boolean) => void;
      enableCamera: (enabled: boolean) => void;
      addLocalMediaStream: (stream: MediaStream, streamName: String) => void;
      removeLocalMediaStream: (streamName: String) => void;
    };
    broadcastDataGuaranteed: (dataType: string, data: object) => void;
    isConnected: () => boolean;
    subscribeToDataChannel: (
      dataType: string,
      callback: (senderId: string, dataType: string, data: object, targetId: string | undefined) => void,
    ) => void;
  };
  utils: {
    getNetworkedEntity: (el: any) => any;
  };
};

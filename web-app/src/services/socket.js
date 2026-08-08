// Ce fichier est un wrapper autour du SocketContext
// Il permet d'utiliser le socket sans le context si nécessaire

let socketInstance = null;

export const setSocketInstance = (socket) => {
  socketInstance = socket;
};

export const getSocket = () => socketInstance;

export const emit = (event, data) => {
  if (socketInstance) {
    socketInstance.emit(event, data);
  }
};

export const on = (event, callback) => {
  if (socketInstance) {
    socketInstance.on(event, callback);
  }
};

export const off = (event, callback) => {
  if (socketInstance) {
    socketInstance.off(event, callback);
  }
};
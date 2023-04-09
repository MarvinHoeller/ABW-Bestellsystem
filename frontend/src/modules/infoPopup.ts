import { Store, NOTIFICATION_TYPE } from 'react-notifications-component';

class InfoPopup {
  constructor() {}

  info(text: string, title = 'Info') {
    console.log(text);
    this.showPopUp(title, text, 'info');
  }

  success(text: string, title = 'Success') {
    console.log(text);
    this.showPopUp(title, text, 'success');
  }

  error(text: string, title = 'Danger') {
    console.error(text);
    this.showPopUp(title, text, 'danger');
  }

  warning(text: string, title = 'Warning') {
    console.warn(text);
    this.showPopUp(title, text, 'warning');
  }

  showPopUp(title: string, message: string, type: NOTIFICATION_TYPE) {
    Store.addNotification({
      title: title,
      message: message,
      type: type,
      insert: 'bottom',
      container: 'bottom-right',
      animationIn: ['animate__animated', 'animate__bounceInRight'],
      animationOut: ['animate__animated', 'animate__bounceOutRight'],
      dismiss: {
        duration: 4000,
        onScreen: true,
      },
    });
  }
}

const InfoPopUp = new InfoPopup();

export default InfoPopUp;

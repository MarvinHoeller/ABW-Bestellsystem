import {
  Button,
  Card,
  Col,
  Form,
  FormControl,
  FormGroup,
  InputGroup,
  Row,
  Modal,
  Toast,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

import { useEffect, useState } from 'react';
import { INotifySchema } from 'schemas/Schemas';
import { formatToLittleDate } from '../../../../modules/Tools';
import { useAuth } from '../../../../authentication/authHandler';
import { AdminRequest, EditorRequest } from '../../../../modules/requester';
import infoPopup from '../../../../modules/infoPopup';

function getRanks() {
  let rankList = [];

  for (let i = 0; i < 3; i++) {
    rankList.push(`${i + 1}. IT`);
  }

  for (let i = 0; i < 4; i++) {
    rankList.push(`${i + 1}. EGS`);
  }

  return rankList;
}

export function DashboardSettings({
  getUsers: getUsers,
}: {
  getUsers: () => void;
}) {
  const navigate = useNavigate();
  const auth = useAuth();

  const [notifications, setNotifications] = useState<INotifySchema[]>([]);
  const [showNotifyPopUp, toggleNotifyPopUp] = useState<boolean>(false);

  useEffect(() => {
    getNotify();
  }, []);

  const refreshKeys = async (): Promise<void> => {
    EditorRequest(auth).put({}, 'keys', (data) => {
      infoPopup.success(
        'Keys wurden erfolgreich aktualisiert!',
        'Keys aktualisiert!'
      );
    });

    window.location.reload();
  };

  const updateRank = async () => {
    EditorRequest(auth).put({}, 'promoteranks', (data) => {
      infoPopup.success(
        'Die Lehrjahre wurden aktualisiert!',
        'Lehrjahre aktualisiert!'
      );

      getUsers();
    });
  };

  const addNotify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const newnotify = {
      start: formData.get('start') as string,
      end: formData.get('end') as string,
      title: formData.get('title') as string,
      text: formData.get('text') as string,
      notifyrank:
        (formData.get('rank') as string) === 'Alle'
          ? undefined
          : formData.get('rank'),
    };

    EditorRequest(auth).post(
      newnotify,
      'notification',
      (data) => {
        toggleNotifyPopUp(false);
        // get notifications because of the new id
        getNotify();
        infoPopup.success('Die Nachricht wurde hinzugefügt!', 'Erfolgreich!');
      }
    );
  };

  const getNotify = async () => {
    EditorRequest(auth).get({},'notifications', (data) => {
      setNotifications(data.res);
    });
  };

  const deleteNotify = async (notifyID: string) => {
    EditorRequest(auth).erase(
      { notifyID: notifyID },
      'notification',
      (data) => {
        setNotifications([
          ...notifications.filter((notify) => notify._id !== notifyID),
        ]);
        infoPopup.success('Die Nachricht wurde gelöscht!', 'Erfolgreich!');
      }
    );
  };

  const resetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const resetinput = {
      updateID: formData.get('updateID') as string,
      password: formData.get('password') as string,
    };

    AdminRequest(auth).put(
      resetinput,
      'pwreset',
      (data) => {
        infoPopup.success(
          `Das Passwort vom User mit der ID ${resetinput.updateID} wurde erfolgreich geändert!`,
          'Passwort geändert!'
        );
      }
    );
  };

  return (
    <>
      <NotificationPopUp
        show={showNotifyPopUp}
        onHide={() => toggleNotifyPopUp(false)}
        onSubmit={(event: React.FormEvent<HTMLFormElement>) => addNotify(event)}
      />
      <Card className="settingscard">
        <h5>Optionen</h5>
        <Row>
          <Col className="mb-4">
            <Button onClick={() => refreshKeys()} variant="info">
              Secret Keys aktualisieren
            </Button>
          </Col>
          <Col className="mb-4">
            <Button onClick={() => updateRank()} variant="info">
              Aktuelle Lehrjahre in das Nächste setzen
            </Button>
          </Col>
          <Col className="mb-4">
            <Button onClick={() => toggleNotifyPopUp(true)} variant="info">
              Benachrichtigung hinzufügen
            </Button>
          </Col>
        </Row>
        <Row>
          <h5>Benachrichtigungen</h5>
        </Row>
        <Row className="notifications mb-4">
          {notifications &&
            notifications.map((notify) => {
              if (notify)
                return (
                  <Col key={'notify' + notify._id}>
                    <Toast onClose={() => deleteNotify(notify._id)}>
                      <Toast.Header>
                        <strong className="me-auto">{notify.title}</strong>
                        <small>{formatToLittleDate(notify.start)}</small>-
                        <small>{formatToLittleDate(notify.end)}</small>
                      </Toast.Header>
                      <Toast.Body>
                        {notify.text} <hr />
                        {notify.rank ? notify.rank : 'Alle'}
                      </Toast.Body>
                    </Toast>
                  </Col>
                );
            })}
        </Row>
        <Row>
          <h5>Passwort von Nutzer resetten</h5>
        </Row>
        <Row>
          <Form onSubmit={resetPassword}>
            <Row>
              <FormGroup as={Col}>
                <InputGroup className="manage">
                  <FormControl
                    placeholder="Benutzer ID"
                    name="updateID"
                    type="text"
                    required
                  />
                  <FormControl
                    placeholder="Neues Passwort"
                    type="password"
                    name="password"
                    required
                  />
                  <Button variant="danger" type="submit">
                    Reset
                  </Button>
                </InputGroup>
              </FormGroup>
            </Row>
          </Form>
        </Row>
      </Card>
    </>
  );
}

export function NotificationPopUp(props: any) {
  return (
    <Modal
      show={props.show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Form onSubmit={props.onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Benachrichtigung hinzufügen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxWidth: '100%' }}>
          <Row>
            <Col>
              <Form.Label>Titel</Form.Label>
              <FormControl
                type="text"
                placeholder="Benachrichtigungstitel eingeben"
                name="title"
                required
              />
            </Col>
            <Col>
              <Form.Label>Verfügbar für</Form.Label>
              <Form.Select name="rank">
                <option value={undefined}>Alle</option>
                {getRanks().map((rank) => {
                  return (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Form.Label>Sichtbar ab:</Form.Label>
              <FormControl type="date" name="start" required />
            </Col>
            <Col>
              <Form.Label>Sichtbar bis:</Form.Label>
              <FormControl type="date" name="end" required />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Form.Label>Nachricht</Form.Label>
              <Form.Control as="textarea" name="text" required rows={3} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Col>
            <Button type="submit" variant="primary">
              Benachrichtigung hinzufügen
            </Button>
          </Col>
          <Col>
            <Button
              onClick={props.onHide}
              className="ms-auto"
              variant="secondary"
            >
              Schließen
            </Button>
          </Col>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
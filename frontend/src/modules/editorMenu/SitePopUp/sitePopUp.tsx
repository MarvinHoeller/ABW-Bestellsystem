import {
  Form,
  Modal,
  Col,
  FormControl,
  Button,
} from 'react-bootstrap';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../authentication/authHandler';
import { CustomPageRequest } from '../../requester';
import infoPopup from '../../infoPopup';

interface AddSiteSettings {
  onHide: () => void;
  show: boolean;
}

export function AddSite(props: AddSiteSettings) {
  const auth = useAuth();
  const navigate = useNavigate();

  const createNewSite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newSite = {
      name: formData.get('name') as string,
      visible: Boolean(formData.get('visible')),
      isBreadSite: Boolean(formData.get('isBreadSite')),
      usingEmails: Boolean(formData.get('usingEmails')),
    };
    console.log(newSite);
    

    CustomPageRequest(auth, () => navigate('/')).post(
      newSite,
      'sites',
      (data) => {
        infoPopup.success(
          `Die Seite ${newSite.name} wurde hinzugefügt`,
          'Seite hinzugefügt'
        );

        auth.getSites();
        props.onHide();
      }
    );
  };

  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Form onSubmit={createNewSite}>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Neue Bestellseite erstellen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxWidth: '100%' }}>
          <Form.Group className="mb-3">
            <Form.Label>Seitenname</Form.Label>
            <FormControl
              type="text"
              placeholder="Seitennamen eingeben"
              name="name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="usingEmails"
              label="Bestellungen via E-Mail absenden"
            />
            <Form.Check
              type="checkbox"
              name="isBreadSite"
              label="Wird zum Brötchenbestellen verwendet?"
            />
            <Form.Check
              type="checkbox"
              name="visible"
              label="Sichtbar? Kann noch umgestellt werden!"
              defaultChecked
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="modal-center-content">
          <Col>
            <Button type="submit" variant="primary">
              Bestellseite hinzufügen
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

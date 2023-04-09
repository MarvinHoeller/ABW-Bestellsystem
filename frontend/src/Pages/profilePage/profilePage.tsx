import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  FormControl,
  FormGroup,
  InputGroup,
  Row,
  Table,
} from 'react-bootstrap';
import { redirect, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../authentication/authHandler';
import Footer from '../../modules/footer/Footer';
import InfoPopUp from '../../modules/infoPopup';
import Menu from '../../modules/menu/Menu';
import { UserRequest } from '../../modules/requester';
import { siteIDTranslator } from '../../modules/Tools';

import './profilePage.css';

interface OrderInfo {
  ordercount: number;
  breadcount: number;
}

function ProfilePage() {
  const auth = useAuth();

  const [isRunner, setRunner] = useState<boolean>(false);
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    ordercount: 0,
    breadcount: 0,
  });

  // Active SiteID
  const [siteID, setSiteID] = useState<string | undefined>(auth.sites[0]?._id);



  useEffect(() => {
    getRunnerData();
  }, [siteID]);

  const getRunnerData = () => {
    UserRequest(auth, () => redirect('/'), siteID).get({}, 'runnerinfo', (data) => {
      setRunner(data.res.isRunner);
      setOrderInfo({
        ordercount: data.res.ordercount,
        breadcount: data.res.breadcount,
      });
    });
  };

  const resetpassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (formData.get('password') === formData.get('oldpassword')) {
      return InfoPopUp.warning('Passwörter sind identisch');
    }

    UserRequest(auth, () => redirect('/')).put(
      { password: formData.get('password') },
      'pwreset',
      (data) => {
        InfoPopUp.info(data.res);
        auth.forceSignout(() => redirect('/'));
      }
    );
  };

  if (!auth.user) {
    return (
      <div>
        {' '}
        <Menu />
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Menu />
      <Container className="content">
        <h3 className="mb-4">
          Hallo {auth.user.forename} {auth.user.surname}
        </h3>
        <Card className="settingscard">
          <Row>
            <Col>
              <h4>Läuferinfos</h4>
              <hr />
            </Col>
          </Row>
          <Row>
            <Col>
              {isRunner ? (
                <>
                  <h5>Du bist Läufer</h5>
                  <div>
                    Hier ein paar Infos, damit die Abholung leichter fällt:
                  </div>
                </>
              ) : (
                <>
                  <h5>
                    Du bist <b>KEIN</b> Läufer
                  </h5>
                  <div>
                    Hier trotzdem ein paar Infos, falls der Läufer fragt:
                  </div>
                </>
              )}
            </Col>
            {auth.sites.length > 1 && (
              <Col className="runnerinfo">
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Bestellseite:{' '}
                    {siteIDTranslator(siteID ?? auth.sites[0]?._id, auth.sites)}{' '}
                    ({auth.sites.length})
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {auth.sites.map((site: any) => (
                      <Dropdown.Item
                        key={site._id}
                        onClick={() => setSiteID(site._id)}
                      >
                        {site.sitename}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            )}
          </Row>
          <Row>
            <Col className="mt-2 ">
              <Table
                className="mt-2 mb-4"
                striped
                hover
                bordered
                responsive={'lg'}
              >
                <tbody>
                  <tr>
                    <th>Wie viele Waren wurden insgesamt bestellt?</th>
                    <td>{orderInfo.breadcount}</td>
                  </tr>
                  <tr>
                    <th>Wie viele Benutzer haben bestellt?</th>
                    <td>{orderInfo.ordercount}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row>
            <Col>
              <h5>Nutzerdaten</h5>
            </Col>
          </Row>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Vorname</th>
                <th>Nachname</th>
                <th>Benutzername</th>
                <th>Ausbildungsjahr</th>
                <th>Läufer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{auth.user.forename}</td>
                <td>{auth.user.surname}</td>
                <td>{auth.user.username}</td>
                <td>{auth.user.rank}</td>
                <td>x{auth.user.runnercount ?? 0}</td>
              </tr>
            </tbody>
          </Table>
          <Form onSubmit={resetpassword}>
            <Row>
              <h5>Passwort resetten</h5>
            </Row>
            <Row>
              <FormGroup as={Col}>
                <InputGroup>
                  <FormControl
                    placeholder="Altes Passwort"
                    type="password"
                    name="oldpassword"
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
          <Row className="mt-4">
            <Col className='mb-3'>
              <Button
                variant="info"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Zwischenspeicher (localStorage) löschen
              </Button>
              <span className='mt-2 ms-4 d-inline'>Diese Daten sind nach erneutem einloggen wieder verfügbar</span>
            </Col>
          </Row>
        </Card>
      </Container>
      <Footer />
    </div>
  );
}

export default ProfilePage;

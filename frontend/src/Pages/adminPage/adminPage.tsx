import React, { useEffect, useState } from 'react';
import { Link, redirect } from 'react-router-dom';
import Menu from '../../modules/menu/Menu';
import {
  Container,
  Row,
  Accordion,
  Card,
  Button,
  Col,
  InputGroup,
  FormControl,
  Form,
  FormGroup,
  Badge,
  Spinner,
  Table,
  Dropdown,
  Fade,
} from 'react-bootstrap';
import Footer from '../../modules/footer/Footer';
import { IorderSchema, IuserSchema, Runners } from '../../../schemas/Schemas';
import './adminPage.css';
import { CheckCircle, XCircle } from 'react-bootstrap-icons';
import infoPopup from '../../modules/infoPopup';
import { useAuth } from '../../authentication/authHandler';
import { AdminRequest, UserRequest } from '../../modules/requester';
import { siteIDTranslator } from '../../modules/Tools';

function AdminPage() {
  const [users, setUsers] = useState<Array<IuserSchema>>([]);
  const [access, setAccess] = useState<boolean>();
  const [search, setSearch] = useState<string>('');

  const auth = useAuth();

  // Active PDF with ID
  const [activeSite, setActivePDF] = useState<string | undefined>(
    auth.sites[0]?._id
  );

  const [pdfbuffer, setPDFBuffer] = useState<string>();
  const [rank, setRank] = useState<string>('');
  const [ordered, setOrdered] = useState<string[]>(['']);
  const [forminput, setFormInput] = useState<{
    phone: string;
    pickUp: string;
    email: string;
    password: string;
  }>({
    phone: '',
    pickUp: '',
    email: '',
    password: '',
  });
  const [resetinput, setResetInput] = useState<{
    password: string;
    updateID: string;
  }>({
    password: '',
    updateID: '',
  });
  const [runner, setRunner] = useState<Runners[]>([]);
  const [activeRunner, setActiveRunner] = useState<Runners | undefined>(runner[0]);

  useEffect(() => {
    getUsers();
    getUserSettings();
    getPDFData();
  }, []);

  useEffect(() => {
    setPDFBuffer(undefined);
    getPDF(activeSite);
  }, [activeSite]);

  // If access denied, redirect to login page via success variable from backend
  useEffect(() => {
    if (access === false) {
      auth.forceSignout(() => redirect('/'));
    }
  }, [access]);

  const sendMailorder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    forminput.email = formData.get('email') as string;
    forminput.phone = formData.get('phone') as string;
    forminput.pickUp = formData.get('pickUp') as string;
    forminput.password = formData.get('password') as string;

    AdminRequest(auth, () => redirect('/'), activeSite).post(
      forminput,
      'mailorder',
      (data: any) => {
        infoPopup.success(
          'Die Email wurde ans Casino übermittelt!',
          'Versendet!'
        );
        setFormInput({
          phone: '',
          pickUp: '',
          email: '',
          password: '',
        });
        getPDFData();
        getUserSettings();
      }
    );
  };

  const resetPassword = (e: any) => {
    e.preventDefault();

    AdminRequest(auth, () => redirect('/')).put(
      resetinput,
      'pwreset',
      (data: any) => {
        infoPopup.success(
          `Das Passwort vom User mit der ID ${resetinput.updateID} wurde erfolgreich geändert!`,
          'Passwort geändert!'
        );
        setResetInput({
          password: '',
          updateID: '',
        });
      }
    );
  };

  const postPDFData = async (postData: any) => {
    AdminRequest(auth, () => redirect('/')).post(
      { data: postData },
      'pdfdata',
      () => {
        infoPopup.info(
          'PDFDaten wurden erfolgreich gespeichert!',
          'PDF Daten gespeichert!'
        );
      }
    );
  };

  const getPDFData = async () => {
    AdminRequest(auth, () => redirect('/')).get({},'pdfdata', (data: any) => {
      setFormInput({
        phone: data.res?.phone ?? '',
        pickUp: data.res?.pickUp ?? '',
        email: data.res?.email ?? '',
        password: data.res?.password ?? '',
      });
    });
  };

  const getPDF = async (siteID?: string) => {
    AdminRequest(auth, () => redirect('/'), siteID).get({},'pdf', (data: any) => {
      setPDFBuffer(data.res);
    });
  };

  const handleNewUser = (accept: boolean, userID: string) => {
    AdminRequest(auth, () => redirect('/')).put(
      { accept, userID },
      'acceptuser',
      (data: any) => {
        if (data.res) {
          infoPopup.success(
            `Der User mit der ID ${userID} wurde erfolgreich akzeptiert!`,
            'User akzeptiert!'
          );
        } else {
          infoPopup.success(
            `Der User mit der ID ${userID} wurde erfolgreich abgelehnt!`,
            'User abgelehnt!'
          );
        }
      }
    );
  };

  const getUsers = async () => {
    UserRequest(auth, () => redirect('/')).get({filter: true},'', (data: any) => {
      if (data.res?.rank) setRank(data.res?.rank);
      else setUsers(data.res);

      setAccess(data.access);
    });
  };

  const handlePDFDataInput = (event: any) => {
    if (event.target.name === '') return;

    setFormInput({
      ...forminput,
      [event.target.name]: event.target.value,
    });
  };

  const handleResetInput = (e: any) => {
    if (e.target.name === '') return;

    setResetInput({
      ...resetinput,
      [e.target.name]: e.target.value,
    });
  };

  const handleRefresh = (
    targetName: 'phone' | 'pickUp' | 'email' | 'password'
  ) => {
    postPDFData({ [targetName]: forminput[targetName] });
    getPDF(activeSite);
  };

  const getUserSettings = async () => {
    AdminRequest(auth, () => redirect('/'), activeSite).get({},
      'usersettings',
      (data: any) => {
        setRunner(data.res?.runners);
        
        setActiveRunner(data.res?.runners.find((runner: Runners) => runner.siteID === activeSite));

        if (data.res?.ordered) setOrdered(data.res?.ordered);
      }
    );
  };

  const searchForRunner = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    AdminRequest(auth, () => {}, activeSite).get({},'runner', (data: any) => {
      //getUserSettings();
      setActiveRunner({
        ...activeRunner,
        ...data.res
      });
      
      infoPopup.success(
        `Der neue Runner ist ${data.res.runner}`,
        'Runner gefunden!'
      );
    });
  };

  const generateItems = (user: IuserSchema, index: number) => {
    return (
      <Fade appear in key={user._id}>
        <Accordion.Item eventKey={user._id} className="userAccord">
          <Accordion.Header>
            <div className="userInfo">
              {index + 1}. {user.forename} {user.surname}{' '}
              <span className="userid">( ID: {user._id})</span>
            </div>
            {user.order.filter((orderitem) => orderitem.siteID === activeSite)
              .length > 0 ? (
              <Badge pill bg="success">
                Hat bestellt
              </Badge>
            ) : (
              <Badge pill bg="danger">
                Nicht bestellt
              </Badge>
            )}
            {user.new === true && (
              <>
                <Badge className="new-badge" pill bg="warning">
                  User nicht bestätigt
                </Badge>
                <div className="isnew">
                  <CheckCircle
                    fill="green"
                    id="checkcircle"
                    onClick={(e) => handleNewUser(true, user._id)}
                  />
                  <XCircle
                    fill="red"
                    id="xcircle"
                    onClick={(e) => handleNewUser(false, user._id)}
                  />
                </div>
              </>
            )}
          </Accordion.Header>
          <Accordion.Body>
            UserID: {user._id}
            <br />
            <h5 className="mt-3">Bestellungen</h5>
            <hr />
            {user.order.length > 0 ? (
              <>
                {user.order
                  .filter((orderitem) => orderitem.siteID === activeSite)
                  .map((order: IorderSchema) => {
                    return (
                      <div key={order._id} className="orderlist">
                        <span>
                          {order.quantity}x {order.name} {order.bread} (
                          {siteIDTranslator(order.siteID, auth.sites)})
                        </span>
                        <ul>
                          {order.sauce.ketchup ? (
                            <li>{order.sauce.ketchup}x Ketchup</li>
                          ) : null}
                          {order.sauce.mustard ? (
                            <li>{order.sauce.mustard}x Senf</li>
                          ) : null}
                          {order.sauce.sweetMustard ? (
                            <li>{order.sauce.sweetMustard}x Süßer Senf</li>
                          ) : null}
                          {order.comment.length > 0
                            ? order.comment.map((comment) => {
                                return <li key={comment}>{comment}</li>;
                              })
                            : null}
                        </ul>
                      </div>
                    );
                  })}
              </>
            ) : null}
          </Accordion.Body>
        </Accordion.Item>
      </Fade>
    );
  };

  // If access not loaded, return empty Loading-Page
  if (access === undefined)
    return (
      <div>
        <Menu needsAdmin onSearch={(e: any) => setSearch(e.target.value)} />
      </div>
    );

  return (
    <>
      <Menu needsAdmin onSearch={(e: any) => setSearch(e.target.value)} />
      <Container className="content">
        <Card className="settingscard">
          <Row className="mb-2">
            <Col>
              <h3>
                Info zur Bestellseite "
                {siteIDTranslator(activeSite ?? auth.sites[0]?._id, auth.sites)}
                "
              </h3>
            </Col>
            {auth.sites.length > 1 && (
              <Col className="pdfselection">
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Bestellseite:{' '}
                    {siteIDTranslator(
                      activeSite ?? auth.sites[0]?._id,
                      auth.sites
                    )}{' '}
                    ({auth.sites.length})
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {auth.sites.map((site: any) => (
                      <Dropdown.Item
                        key={site._id}
                        onClick={() => {
                          setActivePDF(site._id)
                          setActiveRunner(runner.find((runner) => runner.siteID === site._id));
                        }}
                      >
                        {site.sitename}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            )}
          </Row>
          <hr />
          <Row className="mb-2">
            <Col>
              <h4>Generierte PDF</h4>
            </Col>
          </Row>
          <Row>
            <Col className="document-frame">
              {pdfbuffer ? (
                <object
                  data={`data:application/pdf;base64,${pdfbuffer}#toolbar=0&navpanes=0`}
                >
                  PDF wird geladen. Falls diese nicht angezeigt wird, kannst du
                  sie dir alternativ auch{' '}
                  <a
                    download={'bestellung.pdf'}
                    href={`data:application/pdf;base64,${pdfbuffer}`}
                  >
                    HIER
                  </a>{' '}
                  ansehen.
                </object>
              ) : (
                <Spinner animation="border" variant="primary" />
              )}
            </Col>
          </Row>
          <Form onSubmit={sendMailorder}>
            <Row className="mt-4">
              <h5>PDF-Daten</h5>
            </Row>
            <Row>
              <FormGroup as={Col}>
                <InputGroup>
                  <FormControl
                    aria-label="phone"
                    placeholder="Telefonnummer"
                    type="tel"
                    aria-describedby="phoneHelpBlock"
                    required
                    defaultValue={forminput.phone ?? ''}
                    onChange={handlePDFDataInput}
                    name="phone"
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleRefresh('phone')}
                  >
                    Refresh
                  </Button>
                </InputGroup>
                <Form.Text id="phoneHelpBlock" muted>
                  Telefonnummer für evtl. Rückfragen
                </Form.Text>
              </FormGroup>
              <FormGroup as={Col}>
                <InputGroup>
                  <FormControl
                    placeholder="Abholzeit"
                    type="time"
                    name="pickUp"
                    aria-describedby="pickupHelpBlock"
                    required
                    defaultValue={forminput.pickUp ?? ''}
                    onChange={handlePDFDataInput}
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleRefresh('pickUp')}
                  >
                    Refresh
                  </Button>
                </InputGroup>
                <Form.Text id="pickupHelpBlock" muted>
                  Zeit der gewünschten Abholung des Essens
                </Form.Text>
              </FormGroup>
            </Row>
            {auth.sites.filter((site) => site?._id === activeSite)[0]
              ?.usingEmails ? (
              <>
                <Row className="mt-4">
                  <h5>Emaildaten</h5>
                </Row>
                <Row>
                  <FormGroup as={Col}>
                    <InputGroup>
                      <FormControl
                        placeholder="E-Mail-Adresse"
                        type="email"
                        name="email"
                        aria-describedby="emailHelpBlock"
                        required
                        defaultValue={forminput.email ?? ''}
                        onChange={handlePDFDataInput}
                      />
                      <Button
                        variant="primary"
                        id="button-addon2"
                        name="email"
                        onClick={() => handleRefresh('email')}
                      >
                        Refresh
                      </Button>
                    </InputGroup>
                    <Form.Text id="emailHelpBlock" muted>
                      E-Mail-Adresse des Absenders von dem letztendlich die
                      E-Mail gesendet wird
                    </Form.Text>
                  </FormGroup>
                  <FormGroup as={Col}>
                    <InputGroup>
                      <FormControl
                        placeholder="Passwort"
                        type="password"
                        name="password"
                        aria-describedby="passwordHelpBlock"
                        required
                      />
                    </InputGroup>
                    <Form.Text id="passwordHelpBlock" muted>
                      E-Mail-Passwort des Absenders (Wird immer verlangt & daher
                      nicht gespeichert!)
                    </Form.Text>
                  </FormGroup>
                </Row>
                <Row className="mt-4">
                  <Col>
                    <Button
                      type="submit"
                      variant={
                        ordered.includes(activeSite ?? ' ') ? 'info' : 'success'
                      }
                      disabled={ordered.includes(activeSite ?? ' ')}
                      className="buttonmax"
                    >
                      {ordered.includes(activeSite ?? ' ')
                        ? 'Bestellung wurde bereits versendet '
                        : 'Verbindlich Bestellen'}
                    </Button>
                  </Col>
                </Row>
              </>
            ) : (
              <></>
            )}
          </Form>
        </Card>
        <h3 className="mb-4">
          User des {rank || users[0]?.rank} + Bestellungen
        </h3>
        <Accordion>
          {users[0]?._id &&
            users
              .filter((item: IuserSchema) =>
                `${item.forename} ${item.surname}`.includes(search)
              )
              .map((user: IuserSchema, index: number) => {
                return generateItems(user, index);
              })}
        </Accordion>
        <Card className="mt-4 settingscard">
          <Form>
            <Row>
              <h5>Passwort von Nutzer resetten</h5>
            </Row>
            <Row>
              <FormGroup as={Col}>
                <InputGroup>
                  <FormControl
                    placeholder="Benutzer ID"
                    name="updateID"
                    type="text"
                    required
                    onChange={handleResetInput}
                  />
                  <FormControl
                    placeholder="Neues Passwort"
                    type="password"
                    name="password"
                    required
                    onChange={handleResetInput}
                  />
                  <Button
                    variant="danger"
                    type="submit"
                    onClick={resetPassword}
                  >
                    Reset
                  </Button>
                </InputGroup>
              </FormGroup>
            </Row>
          </Form>
          <Form onSubmit={searchForRunner}>
            <Row className="mt-4">
              <Col>
                <h5>Letzter Läufer</h5>
              </Col>
              <Col>
                <h5>Jetziger Läufer</h5>
              </Col>
              <Col></Col>
            </Row>
            <Row>
              <FormGroup as={Col}>
                <InputGroup>
                  <FormControl
                    aria-describedby="lastrunnerHelpBlock"
                    name="lastrunner"
                    defaultValue={activeRunner?.lastrunner ?? ''}
                    disabled
                  />
                </InputGroup>
                <Form.Text id="runnerHelpBlock" muted>
                  ID: ({activeRunner?.lastrunnerID})
                </Form.Text>
              </FormGroup>

              <FormGroup as={Col}>
                <InputGroup>
                  <FormControl
                    aria-describedby="runnerHelpBlock"
                    name="runner"
                    value={activeRunner?.runner ?? ''}
                    disabled
                  />
                </InputGroup>
                <Form.Text id="runnerHelpBlock" muted>
                  ID: ({activeRunner?.runnerID})
                </Form.Text>
              </FormGroup>

              <FormGroup as={Col}>
                <InputGroup>
                  <Button id="runnerButton" variant="success" type="submit">
                    Läufer bestimmen!
                  </Button>
                </InputGroup>
              </FormGroup>
            </Row>
          </Form>
        </Card>
      </Container>
      <Footer />
    </>
  );
}

export default AdminPage;

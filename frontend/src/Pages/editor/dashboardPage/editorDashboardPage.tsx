import { useEffect, useState } from 'react';
import {
  Accordion,
  Badge,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from 'react-bootstrap';
import { XCircle, CheckCircle, TrashFill } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';

import './dashboardPage.css';
import { DashboardSettings } from './dashboardModules/DashboardSettings';
import { useAuth } from '../../../authentication/authHandler';
import { AdminRequest, EditorRequest, UserRequest } from '../../../modules/requester';
import infoPopup from 'modules/infoPopup';
import Menu from '../../../modules/menu/Menu';
import Footer from '../../../modules/footer/Footer';
import EditorMenu from '../../../modules/editorMenu/editorMenu';

interface ImageBuffer {
  data: Buffer;
}

export interface ImenuSchema {
  _id: string;
  name: string;
  infotext: string;
  image: ImageBuffer;
  price: number;
  length: number;
}

interface IsauceSchema {
  ketchup: number;
  mustard: number;
  sweetMustard: number;
}
interface IorderSchema {
  _id: string;
  name: string;
  sauce: IsauceSchema;
  bread: 'normal' | 'multigrain';
  quantity: number;
}
interface IuserSchema {
  _id: string;
  new: boolean;
  forename: string;
  surname: string;
  username: string;
  password: string;
  permissionID: string;
  rank: string;
  order: Array<IorderSchema>;
}

function DashboardPage() {
  const [users, setUsers] = useState<IuserSchema[]>([
    {
      _id: '',
      new: false,
      forename: '',
      surname: '',
      username: '',
      password: '',
      permissionID: '',
      rank: '',
      order: [],
    },
  ]);
  const [EditorAccess, setEditorAccess] = useState<boolean>();
  const [search, setSearch] = useState<string>('');

  let navigate = useNavigate();
  let auth = useAuth();

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    UserRequest(auth, () => navigate('/')).get({}, '', (data) => {
      setEditorAccess(data.access);
      setUsers(data.res);
    });
  };

  const deleteUser = async (userID: string) => {
    EditorRequest(auth, () => navigate('/')).erase(
      { userID: userID },
      'user',
      (data) => {
        setUsers(users.filter((user: IuserSchema) => userID !== user._id));
        infoPopup.success('Benutzer entfernt', 'Erfolgreich!');
      }
    );
  };

  const setPermissionLevel = async (userID: string, promote: string) => {
    EditorRequest(auth, () => navigate('/')).put(
      { userID, promote },
      'promoteadmin',
      (data) => {
        infoPopup.success('Adminstatus verändert!', 'Erfolgreich!');
      }
    );
    await getUsers();
  };

  const handleNewUser = async (userID: string, accept: boolean) => {
    AdminRequest(auth, () => navigate('/')).put(
      { accept, userID },
      'acceptuser',
      (data) => {
        infoPopup.success(
          `Benutzer erfolgreich ${accept ? 'freigeschaltet' : 'gelöscht'}!`,
          'Erfolgreich!'
        );
      }
    );
    await getUsers();
  };

  function generateUserItem(user: IuserSchema) {
    return (
      <Accordion.Item className="userAccord" key={user._id} eventKey={user._id}>
        <Accordion.Header>
          <div className="userInfo">
            <div className="userrank">{user.rank}</div>
            <p>
              {user.forename} {user.surname}
            </p>
          </div>
          {user.new === true && (
            <>
              <Badge className="new-badge" pill bg="warning">
                User nicht bestätigt
              </Badge>
              <div className="isnew">
                <CheckCircle
                  fill="green"
                  id="checkcircle"
                  onClick={() => handleNewUser(user._id, true)}
                />
                <XCircle
                  fill="red"
                  id="xcircle"
                  onClick={() => handleNewUser(user._id, true)}
                />
              </div>
            </>
          )}
        </Accordion.Header>
        <Accordion.Body>
          <Table striped bordered size="sm">
            <thead>
              <tr>
                <th>UserID</th>
                <th>Ausbildungsjahr</th>
                <th>Rolle</th>
                <th>Löschen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{user._id}</td>
                <td>{user.rank}</td>
                <td>
                  <Form.Select
                    onChange={(e) => setPermissionLevel(user._id, e.target.value)}
                    defaultValue={user.permissionID}
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                  </Form.Select>
                </td>
                <td>
                  <TrashFill onClick={() => deleteUser(user._id)} />
                </td>
              </tr>
            </tbody>
          </Table>

          {user.order.length > 0 && <h5>Bestellungen</h5>}
          {user.order.map((order: IorderSchema) => {
            return (
              <div key={order._id}>
                {order.quantity}x {order.name}{' '}
              </div>
            );
          })}
        </Accordion.Body>
      </Accordion.Item>
    );
  }

  return (
    <>
      <Menu onSearch={(e: any) => setSearch(e.target.value)} />
      <Container className="content dashboard">
        <Row className='mb-4'>
          <Col>
            <h1 className="mb-4 d-inline">Willkommen im Editor-Dashboard</h1>
          </Col>
          <Col className='d-flex align-items-center justify-content-end'>
            <EditorMenu />
          </Col>
        </Row>
        <h3>Allgemeine Einstellungen</h3>
        <DashboardSettings getUsers={() => getUsers()} />
        <h3>User</h3>
        <Accordion>
          {users.length === 0 ? (
            <Card className="settingscard">
              <h5>Keine User vorhanden!</h5>
            </Card>
          ) : (
            users
              .filter((user) => {
                if (search === '') {
                  return true;
                } else if (
                  user.forename.toLowerCase().includes(search.toLowerCase()) ||
                  user.surname.toLowerCase().includes(search.toLowerCase())
                ) {
                  return true;
                }
                return false;
              })
              .sort(
                (a, b) =>
                  Number(a.rank.split('.')[0]) - Number(b.rank.split('.')[0])
              )
              .sort((a, b) => {
                let first = a.rank.split('.')[1];
                let second = b.rank.split('.')[1];

                if (first < second) {
                  return 1;
                } else if (first > second) {
                  return -1;
                }
                return 0;
              })
              .map((user, index) => {
                return generateUserItem(user);
              })
          )}
        </Accordion>
      </Container>
      <Footer />
    </>
  );
}

export default DashboardPage;

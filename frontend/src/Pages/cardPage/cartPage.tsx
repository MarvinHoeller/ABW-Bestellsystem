import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Container, Dropdown, Row, Table } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';

import Menu from '../../modules/menu/Menu';
import Footer from '../../modules/footer/Footer';
import {
  breadTranslate,
  formatToCurrent,
  sauceTranslator,
  siteIDTranslator,
} from '../../modules/Tools';
import {
  IMenuSchema,
  IorderSchema,
  MenuAdditions,
  Site,
} from '../../../schemas/Schemas';
import infoPopup from '../../modules/infoPopup';
import { useAuth } from '../../authentication/authHandler';
import './cartPage.css';
import RandomNamePicker from './RandomNamePicker';
import {
  CustomPageRequest,
  MenuRequest,
  UserRequest,
} from '../../modules/requester';

function CartPage() {
  const [order, setOrder] = useState<IorderSchema[]>([]);
  const [menu, setMenu] = useState<IMenuSchema[]>([]);
  const [menuAdditions, setMenuAdditions] = useState<
    Array<{ _id: string; menuAdditions: MenuAdditions[] }>
  >([]);

  const auth = useAuth();

  const [access, setAccess] = useState<boolean>();

  const [search, setSearch] = useState('');
  const [activeSite, setActiveSite] = useState(auth.sites[0]?._id);

  const navigate = useNavigate();

  useEffect(() => {
    setOrder(auth.user ? auth.user.order : []);
    getMenu();
    getMenuAdditions();
  }, []);

  // If access denied, redirect to login page via success variable from backend
  useEffect(() => {
    if (access === false) {
      auth.forceSignout(() => navigate('/'));
    }
  }, [access]);

  const getMenu = async () => {
    MenuRequest(auth, () => navigate('/')).get({},'', (data) => {
      setMenu(data.res);
      setAccess(data.access);
    });
  };

  const getMenuAdditions = async () => {
    CustomPageRequest(auth, () => navigate('/')).get({},'menuAddions', (data) => {
      setMenuAdditions(data.res);
    });
  };

  const getItemPrice = (itemid: string) => {
    for (let i = 0; i < menu.length; i++) {
      if (menu[i]._id === itemid.split('-')[0]) {
        return menu[i].price;
      }
    }

    return 0;
  };

  const deleteItem = async (id: string) => {
    UserRequest(auth, () => navigate('/')).put(
      { order_id: id },
      'deleteorder',
      (data: any) => {
        // clear item from cart on delete
        setOrder(
          order.filter(function (item: IorderSchema) {
            return item._id !== id;
          })
        );
        auth.updateUserOrder();

        infoPopup.success(
          `Du hast soeben ein Item gelöscht!`,
          'Löschung Erfolgreich!'
        );
      }
    );
  };

  const GenerateCart = () => {
    /**
     * Total sum of order
     */
    let total = 0;

    /**
     * Current filtered order by site
     */
    let curorder: IorderSchema[] = order.filter(
      (item: IorderSchema) =>
        item.name.includes(search) && item.siteID === activeSite
    );

    if (curorder.length === 0) return <></>;

    return (
      <div className="orders" key={activeSite + 'orders'}>
        <Table striped bordered hover size="sm" variant="dark">
          <thead>
            <tr>
              <th>Name</th>
              <th>Typ</th>
              <th>Anzahl</th>
              <th>Bemerkung</th>
              <th>Zusatz</th>
              <th>Kosten</th>
              <th>Löschen</th>
            </tr>
          </thead>
          <tbody>
            {curorder
              // .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((item: IorderSchema, index: number) => {
                /**
                 * Loops through all comments
                 *
                 * 1. searches the price by the current comment-name,
                 * 2. multiply`s the found price by the item quantity
                 * - (repeats step 1 & 2 until list is empty)
                 * @returns sum of the calculated prices per comment
                 */

                const AdditionPrice: number = item.comment.reduce(
                  (lastValue, itemName) => {
                    return (
                      lastValue +
                      (menuAdditions
                        .find(
                          (additionsOfSiteX) =>
                            additionsOfSiteX._id === item.siteID
                        )
                        ?.menuAdditions.find(
                          (additions) => additions.name === itemName
                        )?.price || 0) *
                        item.quantity
                    );
                  },
                  0
                );

                total += item.quantity * getItemPrice(item._id) + AdditionPrice;

                console.log();

                return (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{breadTranslate(item.bread)}</td>
                    <td>
                      {item.quantity} je{' '}
                      {formatToCurrent(getItemPrice(item._id))}
                    </td>
                    <td>
                      {item.comment.map((comment) => {
                        return (
                          <div key={comment}>
                            {`${comment} je ${formatToCurrent(
                              /** Find the addition-Array by the Item-SiteID.
                               *  Then find the current price of the current comment and return it
                               */
                              menuAdditions
                                .find(
                                  (additionsOfSiteX) =>
                                    additionsOfSiteX._id === item.siteID
                                )
                                ?.menuAdditions.find(
                                  (additions) => additions.name === comment
                                )?.price
                            )}`}
                            <br />
                          </div>
                        );
                      })}
                    </td>
                    <td>
                      {item.sauce
                        ? Object.entries(item.sauce).map(([key, value]) => {
                            if (value === null || value === 0) {
                              return null;
                            }

                            return (
                              <div key={key} className="me-4">
                                {value}x {sauceTranslator(key)}
                              </div>
                            );
                          })
                        : '-'}
                    </td>
                    <td>
                      {formatToCurrent(
                        Number(item.quantity) * getItemPrice(item._id) +
                          AdditionPrice
                      )}
                    </td>
                    <td
                      style={{
                        alignItems: 'center',
                      }}
                      onClick={() => deleteItem(item._id)}
                    >
                      <Trash className="icon" />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
        <h5>Die Gesamtkosten belaufen sich auf {formatToCurrent(total)}</h5>
      </div>
    );
  };

  if (access === undefined)
    return (
      <div>
        <Menu needsAdmin onSearch={(e: any) => setSearch(e.target.value)} />
      </div>
    );

  return (
    <div>
      <Menu needsAdmin onSearch={(e: any) => setSearch(e.target.value)} />
      <Container className="content">
        <h1>Warenkorb</h1>
        {order.length === 0 ? (
          <h5 className="mt-4">Ganz schön leer hier :(</h5>
        ) : (
          <>
            <Row>
              <Col>
                <h3 className="mt-5">
                  {siteIDTranslator(activeSite, auth.sites)}
                </h3>
              </Col>
              {auth.sites.length > 1 && (
                <Col className="cart-dropdown">
                  <Dropdown className="mt-5 mb-2">
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                      {siteIDTranslator(activeSite, auth.sites)} (
                      {auth.sites.length})
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {auth.sites.map((site: any) => (
                        <Dropdown.Item
                          key={site._id}
                          onClick={() => setActiveSite(site._id)}
                        >
                          {site.sitename}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              )}
            </Row>
            <GenerateCart />
          </>
        )}
        <Card className="mt-5 bg-dark text-white">
          <Card.Body className="todays-runner">
            <RandomNamePicker siteID={activeSite ?? ''} />
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </div>
  );
}

export default CartPage;

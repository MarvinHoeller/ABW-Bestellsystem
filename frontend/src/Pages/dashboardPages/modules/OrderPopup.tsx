import { useEffect, useState } from 'react';
import { Button, Col, Form, FormControl, Modal, Row } from 'react-bootstrap';
import { formatToCurrent } from '../../../modules/Tools';
import { IsauceSchema, NestedMenuAdditions, IOrderPopupData } from '../../../../schemas/Schemas';
import { useAuth } from '../../../authentication/authHandler';

interface OrderPopup {
  modalShow: boolean;
  isBreadSite: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  hideModal: () => void;
  popUpData: IOrderPopupData;
  menuAdditions: NestedMenuAdditions;
}

export function OrderPopup({
  modalShow,
  handleSubmit,
  hideModal,
  popUpData,
  menuAdditions,
  isBreadSite,
}: OrderPopup) {
  if (popUpData === undefined) return <></>;
  if (!menuAdditions) return <></>;


  const [productCount, setProductCount] = useState<number>(1);
  const [sauces, setSauce] = useState<IsauceSchema>({
    ketchup: 0,
    mustard: 0,
    sweetMustard: 0,
  });
  const [comments, setComments] = useState<string[]>([]);

  useEffect(() => {
    if (!modalShow) return;
    setProductCount(1);
    setSauce({
      ketchup: 0,
      mustard: 0,
      sweetMustard: 0,
    });

    setComments([]);
  }, [modalShow]);

  /**
   * If the sum of the sauces is less than or equal to the quantity, then return the quantity plus one,
   * otherwise return the sauce.
   * @param {number} sauce - number - the number of sauces the user has selected
   * @returns the sum of the sauces.
   */
  const getSauceSum = (sauce: number) => {
    const sum = productCount;

    return sauces.ketchup + sauces.mustard + sauces.sweetMustard
      ? sum + 1
      : productCount;
  };

  const calcPrice = () => {
    var additionPrice = 0;

    /* Adding the price of the menu additions to the total price. */
    menuAdditions.menuAdditions.map((value) => {
      if (value && comments.find((comment) => comment === value.name))
        additionPrice += value.price * productCount;
    });

    let calculated = productCount * popUpData.price + additionPrice;

    return `${productCount} x ${formatToCurrent(
      popUpData.price
    )} = ${formatToCurrent(calculated)}`;
  };


  return (
    //TODO: change some variables
    <Modal
      show={modalShow}
      onHide={hideModal}
      // onChange={handleChange}
      animation={true}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            {popUpData.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isBreadSite ? (<>
            <Row>
              <Col>
                <Form.Label>Brottyp</Form.Label>
                <Form.Select name="bread">
                  <option value="normal">Normal</option>
                  <option value="multigrain">Mehrkorn</option>
                </Form.Select>
              </Col>
            </Row>
            <Row className="mt-3 mb-3">
              <Col>
                <Form.Label>Ketchup</Form.Label>
                <FormControl
                  type="number"
                  placeholder="Ketchup"
                  name="ketchup"
                  max={getSauceSum(sauces.ketchup)}
                  min={0}
                  value={sauces.ketchup}
                  onChange={(event) => {
                    setSauce((prev) => {
                      return {
                        ...prev,
                        [event.target.name]: Number(event.target.value),
                      };
                    });
                  }}
                />
              </Col>
              <Col>
                <Form.Label>Senf</Form.Label>
                <FormControl
                  type="number"
                  placeholder="Senf"
                  name="mustard"
                  max={getSauceSum(sauces.mustard)}
                  min={0}
                  value={sauces.mustard}
                  onChange={(event) => {
                    setSauce((prev) => {
                      return {
                        ...prev,
                        [event.target.name]: Number(event.target.value),
                      };
                    });
                  }}
                />
              </Col>
              <Col>
                <Form.Label>Süßer Senf</Form.Label>
                <FormControl
                  type="number"
                  placeholder="Süßer Senf"
                  name="sweetMustard"
                  max={getSauceSum(sauces.sweetMustard)}
                  min={0}
                  value={sauces.sweetMustard}
                  onChange={(event) => {
                    setSauce((prev) => {
                      return {
                        ...prev,
                        [event.target.name]: Number(event.target.value),
                      };
                    });
                  }}
                />
              </Col>
              {/* <Form.Text className="text-muted">
              Hier kannst du die Anzahl der Saucen auswählen
            </Form.Text> */}
            </Row>
          </>) : null}
          <Row>
            <Col>
              <Form.Label>Anzahl</Form.Label>
              <FormControl
                type="number"
                name="quantity"
                required
                max={10}
                placeholder="Anzahl"
                value={productCount}
                onChange={(event) => {
                  setProductCount(Number(event.target.value));
                }}
              />
            </Col>
            <Col>
              <Form.Label>Preis für {productCount} Stück</Form.Label>
              <FormControl
                type="text"
                name="quantity"
                value={calcPrice()}
                max={10}
                placeholder="Kosten"
                disabled
              />
            </Col>
          </Row>
          {/* <Form.Text className="text-muted">
            Die Anzahl ist auf 10 pro Anfrage begrenzt
          </Form.Text> */}

          {menuAdditions.menuAdditions.length > 0 ? (
            <Row className="mt-3">
              <Form.Label>Bemerkung (optional)</Form.Label>
              {menuAdditions.menuAdditions.map((option, index) => {

                if (option)
                  return (
                    <>
                      {index % 2 === 0 ? <Row /> : null}
                      <Col
                        key={`comment-${index}`}
                      >
                        <Form.Check
                          type={'checkbox'}
                          name="comment"
                          label={`${option.name} (+${formatToCurrent(
                            option.price
                          )} pro Brötchen)`}
                          checked={comments.includes(option.name)}
                          value={option.name}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setComments((prev) => {
                                return [...prev, event.target.value];
                              });
                            } else {
                              setComments((prev) => {
                                return prev.filter(
                                  (comment) => comment !== event.target.value
                                );
                              });
                            }
                          }}
                        />
                      </Col>
                    </>
                  );
              })}
            </Row>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" variant="primary">
            In den Warenkorb
          </Button>
          <Button onClick={hideModal} className="ms-auto" variant="secondary">
            Schließen
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

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


  const [productCount, setProductCount] = useState<number>(popUpData.quantity);
  const [sauces, setSauce] = useState<IsauceSchema>({
    ketchup: popUpData.sauce?.ketchup ?? 0,
    mustard: popUpData.sauce?.mustard ?? 0,
    sweetMustard: popUpData.sauce?.sweetMustard ?? 0,
  });
  const [comments, setComments] = useState<string[]>(popUpData.comment ?? []);

  useEffect(() => {
    if (!modalShow) return;
    setProductCount(popUpData.quantity);
    setSauce({
      ketchup: popUpData.sauce?.ketchup ?? 0,
      mustard: popUpData.sauce?.mustard ?? 0,
      sweetMustard: popUpData.sauce?.sweetMustard ?? 0,
    });

    setComments(popUpData.comment ?? []);
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

  /**
   * If the event target's name is comment, then set the comments state to the previous comments state
   * plus the event target's value if the event target is checked, otherwise set the comments state to
   * the previous comments state minus the event target's value.
   *
   * If the event target's name is not comment, then set the bread count state to the event target's
   * value.
   * @param event - React.ChangeEvent<HTMLInputElement>
   */
  // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {

  //   switch (event.target.name) {
  //     case 'comment':

  //       break;
  //   }
  // };

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
          {isBreadSite ? (
            <>
              <Row>
                <Col>
                  <Form.Label>Brottyp</Form.Label>
                  <Form.Select name="bread">
                    <option value="normal">Normal</option>
                    <option value="multigrain">Mehrkorn</option>
                  </Form.Select>
                </Col>
              </Row>
              <Row className="mt-3">
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
                <Form.Text className="text-muted">
                  Die Anzahl der Saucen darf nicht größer als die Anzahl der
                  Brötchen + 1 sein.
                </Form.Text>
              </Row>
              <Row className="mt-3">
                <Col>
                  <Form.Label>Anzahl</Form.Label>
                  <FormControl
                    type="number"
                    name="quantity"
                    required
                    max={10}
                    placeholder="Anzahl der Brötchen"
                    value={productCount}
                    onChange={(event) => {
                      setProductCount(Number(event.target.value));
                    }}
                  />
                </Col>
                <Col>
                  <Form.Label>Kosten bei {productCount} Brötchen</Form.Label>
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
              <Form.Text className="text-muted">
                Die Anzahl der Brötchen ist auf 10 begrenzt. Falls bereits etwas
                auf den selben Artikel bestellt wurde, wird das Brötchen mit
                dieser Bestellung aktualisiert.
              </Form.Text>

              {menuAdditions.menuAdditions.length > 0 ? (
                <Row className="mt-3">
                  <Col>
                    <Form.Label>Bemerkung (optional)</Form.Label>
                    {menuAdditions.menuAdditions.map((option, index) => {
                      if (option)
                        return (
                          <Form.Check
                            type={'checkbox'}
                            key={`comment-${index}`}
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
                        );
                    })}
                  </Col>
                </Row>
              ) : null}
            </>
          ) : (
            <>
              <Row>
                <Col>
                  <Form.Label>Anzahl</Form.Label>
                  <FormControl
                    type="number"
                    name="quantity"
                    required
                    max={10}
                    placeholder="Anzahl"
                  />
                </Col>
                <Col>
                  <Form.Label>
                    Kosten bei {productCount} {popUpData.name}
                  </Form.Label>
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
              {menuAdditions.menuAdditions.length > 0 ? (
                <Row className="mt-3">
                  <Col>
                    <Form.Label>Bemerkung (optional)</Form.Label>
                    {menuAdditions.menuAdditions.map((option, index) => {
                      if (option)
                        return (
                          <Form.Check
                            type={'checkbox'}
                            key={`comment-${index}`}
                            name="comment"
                            label={`${option.name} (+${formatToCurrent(
                              option.price
                            )} pro ${popUpData.name})`}
                            value={option.name}
                          />
                        );
                    })}
                  </Col>
                </Row>
              ) : null}
            </>
          )}
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

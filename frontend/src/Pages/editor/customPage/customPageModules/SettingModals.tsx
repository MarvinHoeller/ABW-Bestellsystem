import {
	Button, Col, Form,
	FormControl,
	InputGroup,
	Modal,
	Row
} from "react-bootstrap";
import { formatToCurrent } from "../../../../modules/Tools";
import placeholder from "../../../../cosmectics/placeholder.svg";
interface ModalProps {
	show: boolean;
	menuitem?: IItem;
	onHide: () => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>, menuID?: string) => Promise<void>;
	onChange: (event: any) => void
}

interface IItem {
	_id?: string;
	name: string;
	price: number;
	infotext: string;
	image: Blob,
}

export function AddIngredient(props: ModalProps) {
	return (
		<Modal
			show={props.show}
			onHide={props.onHide}
			onChange={props.onChange}
			size="lg"
			aria-labelledby="contained-modal-title-vcenter"
			centered
		>
			<Form onSubmit={props.onSubmit}>
				<Modal.Header closeButton>
					<Modal.Title id="contained-modal-title-vcenter">
						Bestellzusatz hinzufügen
					</Modal.Title>
				</Modal.Header>
				<Modal.Body style={{ maxWidth: "100%" }}>
					<Row>
						<Col>
							<Form.Label>Produktname</Form.Label>
							<FormControl
								type="text"
								placeholder="Produktnamen eingeben"
								name="name" />
						</Col>
					</Row>
					<Row className="mt-3">
						<Col>
							<Form.Label>Preis</Form.Label>
							<FormControl
								type="number"
								placeholder="Preis eingeben"
								step={"0.01"}
								name="price" />
						</Col>
						<Col>
							<Form.Label>Preis Vorschau</Form.Label>
							<InputGroup.Text>
								{formatToCurrent(
									props.menuitem?.price
								)} pro Produkt
							</InputGroup.Text>
						</Col>
					</Row>
				</Modal.Body>
				<Modal.Footer>
					<Col>
						<Button type="submit" variant="primary">
							Zusatz hinzufügen
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

export function UpsertItemItem(props: ModalProps) {
	return (
		<Modal
			show={props.show}
			onHide={props.onHide}
			onChange={props.onChange}
			size="lg"
			aria-labelledby="contained-modal-title-vcenter"
			centered
		>
			<Form onSubmit={(event: React.FormEvent<HTMLFormElement>) => props.onSubmit(event, props.menuitem?._id)}>
				<Modal.Header closeButton>
					<Modal.Title id="contained-modal-title-vcenter">
						{props.menuitem?._id ? `"${props.menuitem.name}" bearbeiten` : "Menüelement hinzufügen"}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body style={{ maxWidth: "100%" }}>
					<Row>
						<Col>
							<Form.Label>Produktname</Form.Label>
							<FormControl
								type="text"
								placeholder="Produktnamen eingeben"
								name="name" 
								defaultValue={props.menuitem?.name}
								/>
						</Col>
						<Col>
							<Form.Label>Bild (Optional)</Form.Label>

							<FormControl
								type="file"
								accept="image/*"
								name="image" />
						</Col>
					</Row>

					<Row className="mt-3">
						<Col>
							<Form.Label>
								Produktinfo (Optional)
							</Form.Label>
							<FormControl
								as="textarea"
								placeholder="Produktinfo eingeben"
								name="infotext"
								defaultValue={props.menuitem?.infotext}
								rows={8} />
						</Col>
						<Col className="image-preview">
							<Form.Label>Bild (Vorschau)</Form.Label>

							<img
								src={props.menuitem?.image?.size
									? URL.createObjectURL(
										props
											.menuitem
											.image
									)
									: placeholder} />
						</Col>
					</Row>

					<Row className="mt-3">
						<Col>
							<Form.Label>Preis</Form.Label>
							<FormControl
								type="number"
								defaultValue={props.menuitem?.price}
								placeholder="Preis eingeben"
								step={"0.01"}
								name="price" />
						</Col>
						<Col>
							<Form.Label>Preis Vorschau</Form.Label>
							<InputGroup.Text>
								{formatToCurrent(
									props.menuitem?.price
								)} pro Produkt
							</InputGroup.Text>
						</Col>
					</Row>
				</Modal.Body>
				<Modal.Footer>
					<Col>
						<Button type="submit" variant="primary">
							{props.menuitem?._id ? `"${props.menuitem.name}" überarbeiten` : "Menüelement hinzufügen"}
						</Button>
					</Col>
					<Col>
						<Button
							onClick={props.onHide}
							className="ms-auto"
							variant="secondary"
						>
							Close
						</Button>
					</Col>
				</Modal.Footer>
			</Form>
		</Modal>
	);
}

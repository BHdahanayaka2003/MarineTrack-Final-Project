import React, { useState } from 'react';
import { Card, Table, Container, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg'; // Ensure this path is correct
import logoImage from './logo.png'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';

const OwnerDetails = () => {
    const navigate = useNavigate();

    // Editable fields (using state)
    const [ownerData, setOwnerData] = useState({
        name: 'Sunil',
        boatName: 'Gamunu Putha',
        idNumber: '123456789V',
        boatID: 'CAT 9666',
        phone: '+94 0114555587',
        email: 'BenTenison@gmail.com',
        address: 'America',
        requirements: 'PDF',
    });

    const [isEditing, setIsEditing] = useState(false);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setOwnerData({ ...ownerData, [name]: value });
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    return (
        <div
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '100vh',
                width: '100vw',
                margin: 0,
                padding: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Container
                fluid
                className="d-flex justify-content-center align-items-center"
                style={{ height: '100%', padding: '20px' }}
            >
                <Card
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        width: '100%',
                        maxWidth: '800px',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        borderRadius: '15px',
                        backdropFilter: 'blur(5px)',
                        WebkitBackdropFilter: 'blur(5px)',
                        overflow: 'hidden',
                    }}
                >
                    <Card.Body>
                        <div className="d-flex align-items-center mb-4 pb-2 border-bottom" style={{ width: '100%' }}>
                            <img
                                src={logoImage}
                                alt="Logo"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    objectFit: 'contain',
                                    marginRight: '20px',
                                    position: 'absolute',
                                    top: '20px',
                                    left: '20px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/Dashboard')}
                            />
                            <h1 className="m-0 w-100 text-center">Information</h1>
                        </div>

                        {/* Edit Button */}
                        <div className="text-end mb-3">
                            <Button variant={isEditing ? "success" : "primary"} onClick={handleEditToggle}>
                                {isEditing ? "Save" : "Edit"}
                            </Button>
                        </div>

                        {/* Editable Table */}
                        <Table borderless responsive>
                            <tbody>
                                <tr>
                                    <td className="fw-bold text-secondary">Name</td>
                                    <td>:</td>
                                    <td>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                value={ownerData.name}
                                                onChange={handleChange}
                                            />
                                        ) : (
                                            ownerData.name
                                        )}
                                    </td>
                                    <td className="fw-bold text-secondary">Boat Name</td>
                                    <td>:</td>
                                    <td>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                name="boatName"
                                                value={ownerData.boatName}
                                                onChange={handleChange}
                                            />
                                        ) : (
                                            ownerData.boatName
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">ID Number</td>
                                    <td>:</td>
                                    <td>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                name="idNumber"
                                                value={ownerData.idNumber}
                                                onChange={handleChange}
                                            />
                                        ) : (
                                            ownerData.idNumber
                                        )}
                                    </td>
                                    <td className="fw-bold text-secondary">Boat ID</td>
                                    <td>:</td>
                                    <td>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                name="boatID"
                                                value={ownerData.boatID}
                                                onChange={handleChange}
                                            />
                                        ) : (
                                            ownerData.boatID
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">Phone Number</td>
                                    <td>:</td>
                                    <td colSpan="4">
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                name="phone"
                                                value={ownerData.phone}
                                                onChange={handleChange}
                                            />
                                        ) : (
                                            ownerData.phone
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">Email</td>
                                    <td>:</td>
                                    <td colSpan="4">
                                        {isEditing ? (
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={ownerData.email}
                                                onChange={handleChange}
                                            />
                                        ) : (
                                            ownerData.email
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">Address</td>
                                    <td>:</td>
                                    <td colSpan="4">
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                name="address"
                                                value={ownerData.address}
                                                onChange={handleChange}
                                            />
                                        ) : (
                                            ownerData.address
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>

                        {/* Requirements */}
                        <Card className="bg-light mt-3">
                            <Card.Body>
                                <Card.Text className="mb-0">
                                    <strong>Requirements</strong><br />
                                    {isEditing ? (
                                        <Form.Control
                                            type="text"
                                            name="requirements"
                                            value={ownerData.requirements}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        ownerData.requirements
                                    )}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Card.Body>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-top text-center">
                        <p className="text-muted mb-0 small">
                            Fisheries Management System • v2.1.0 • © 2025
                        </p>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default OwnerDetails;

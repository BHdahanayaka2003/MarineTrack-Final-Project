const { auth, db } = require('../firebase/admin');
const jwt = require('jsonwebtoken');

const generateToken = (uid) => {
  return jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 1. Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username
    });

    // 2. Save additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      username,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Generate JWT token
    const token = generateToken(userRecord.uid);

    res.status(201).json({
      uid: userRecord.uid,
      email,
      username,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // 2. Verify password (simplified - use Firebase Client SDK in production)
    // In a real app, this should be handled by Firebase Client SDK
    const token = generateToken(userRecord.uid);

    // 3. Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      username: userData.username,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    res.json({
      uid: req.uid,
      email: userData.email,
      username: userData.username
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
};
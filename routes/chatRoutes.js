const express = require('express');
const router = express.Router();
const Chat = require('../models/chatModel');

// GET /chat - fetch all messages (for debugging)
router.get('/', async (req, res) => {
  try {
    const messages = await Chat.find().sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /chat/inbox/all - fetch latest message per sender (admin inbox)
router.get('/inbox/all', async (req, res) => {
  try {
    const threads = await Chat.aggregate([
      { $match: { receiver: 'admin' } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sender",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    res.status(200).json(threads);
  } catch (err) {
    console.error('Failed to fetch inbox:', err);
    res.status(500).json({ error: 'Inbox fetch failed' });
  }
});

// GET /chat/:sender - fetch 2-way conversation and mark as seen
router.get('/:sender', async (req, res) => {
  try {
    const sender = req.params.sender;

    // Mark all user messages as seen
    await Chat.updateMany(
      { sender, receiver: 'admin', seen: false },
      { $set: { seen: true } }
    );

    const messages = await Chat.find({
      $or: [
        { sender, receiver: 'admin' },
        { sender: 'admin', receiver: sender }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user messages' });
  }
});

// POST /chat - save a new message
router.post('/', async (req, res) => {
  try {
    const { sender, content, timestamp, receiver = 'admin' } = req.body;

    if (!sender || !content || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`📨 New message from "${sender}" to "${receiver}": ${content}`);

    const newMessage = new Chat({
      sender,
      receiver,
      content,
      timestamp,
      seen: receiver === 'admin' ? false : true // admin messages are instantly seen
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// PATCH /chat/seen/:sender - mark all messages from sender as seen
router.patch('/seen/:sender', async (req, res) => {
  try {
    const sender = req.params.sender;

    const updated = await Chat.updateMany(
      { sender, receiver: 'admin', seen: false },
      { $set: { seen: true } }
    );

    res.status(200).json({ message: `Marked ${updated.modifiedCount} messages as seen` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
});

// DELETE /chat/:id - delete a message by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Chat.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// DELETE /chat/thread/:sender - delete all messages from and to a specific sender
router.delete('/thread/:sender', async (req, res) => {
  try {
    const sender = req.params.sender;

    const deleted = await Chat.deleteMany({
      $or: [
        { sender: sender, receiver: 'admin' },
        { sender: 'admin', receiver: sender }
      ]
    });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ error: 'No messages found for this thread' });
    }

    res.status(200).json({ message: `Deleted ${deleted.deletedCount} messages from thread "${sender}"` });
  } catch (err) {
    console.error('Thread deletion failed:', err);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

module.exports = router;

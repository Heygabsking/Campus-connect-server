const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/chats/find-or-create
const findOrCreateChat = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'Recipient ID is required' });

    // Look for chat with exactly these two participants
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, recipientId], $size: 2 }
    }).populate('participants', 'username profilePhoto');

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, recipientId]
      });
      await chat.populate('participants', 'username profilePhoto');
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chats
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'username profilePhoto')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' }
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chats/:chatId/messages
const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });
    if (!chat) return res.status(403).json({ message: 'Not authorized to view this chat' });

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'username profilePhoto')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chats/message
const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    if (!chatId) return res.status(400).json({ message: 'Chat ID is required' });

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });
    if (!chat) return res.status(403).json({ message: 'Not authorized to message in this chat' });

    let mediaUrl = '';
    let mediaType = 'text';

    if (req.file) {
      mediaUrl = req.file.path;
      if (req.file.mimetype.startsWith('image')) {
        mediaType = 'image';
      } else if (req.file.mimetype.startsWith('video')) {
        mediaType = 'video';
      } else if (req.file.mimetype.startsWith('audio') || req.file.originalname.endsWith('.webm') || req.file.originalname.endsWith('.mp3') || req.file.originalname.endsWith('.wav')) {
        mediaType = 'audio';
      }
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      text: text || '',
      mediaUrl,
      mediaType
    });

    chat.lastMessage = message._id;
    await chat.save();

    await message.populate('sender', 'username profilePhoto');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only unsend your own messages' });
    }

    const chatId = message.chat;
    await Message.findByIdAndDelete(messageId);

    const chat = await Chat.findById(chatId);
    if (chat && chat.lastMessage && chat.lastMessage.toString() === messageId) {
      const nextLatest = await Message.findOne({ chat: chatId }).sort({ createdAt: -1 });
      chat.lastMessage = nextLatest ? nextLatest._id : null;
      await chat.save();
    }

    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  findOrCreateChat,
  getChats,
  getMessages,
  sendMessage,
  deleteMessage
};

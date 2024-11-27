const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const app = express();
const PORT = 5000;
const MONGO_URI = 'mongodb+srv://diegobrunorocha:D3aDP0OL@cluster0.c3tfg.mongodb.net/trabalho_new?retryWrites=true&w=majority&appName=Cluster0';


app.use(cors()); 
app.use(express.json());

// Conexão com o MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB conectado!'))
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB', err);
    process.exit(1); 
  });


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios!' });
    }

    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    
    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      
      res.status(400).json({ error: 'O e-mail já está em uso.' });
    } else {
      console.error('Erro ao criar o usuário:', error);
      res.status(500).json({ error: 'Erro ao criar o usuário.' });
    }
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


app.get('/users', async (req, res) => {
    try {
      const users = await User.find({}, { password: 0 }); // Exclui o campo de senha
      res.status(200).json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro ao buscar usuários." });
    }
  });
  
  
  app.put('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
  
      if (!name || !email) {
        return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
      }
  
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { name, email },
        { new: true, runValidators: true } 
      );
  
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
  
      res.status(200).json({ message: "Usuário atualizado com sucesso!", user: updatedUser });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
  });
  
  
  app.delete('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedUser = await User.findByIdAndDelete(id);
  
      if (!deletedUser) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
  
      res.status(200).json({ message: "Usuário excluído com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ error: "Erro ao excluir usuário." });
    }
  });


app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'E-mail ou senha incorretos!' });
        }

        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'E-mail ou senha incorretos!' });
        }

        
        const token = jwt.sign({ userId: user._id }, 'seu-segredo', { expiresIn: '1h' });

        res.json({ message: 'Login realizado com sucesso!', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});
  
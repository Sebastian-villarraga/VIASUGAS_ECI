const login = async (req, res) => {
  try {
    const { email } = req.body;

    // LOGIN LIBRE (modo desarrollo)
    res.json({
      token: "dev-token",
      user: {
        email: email || "demo@viasugas.com",
        nombre: "Usuario Demo"
      }
    });

  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({ error: "Error en login" });
  }
};

module.exports = {
  login
};
import express from "express";

const router = express.Router();

/*
ENVOYER UN MESSAGE
*/

router.post("/chat/send", async (req, res) => {

    const db = req.app.locals.db;

    const {
        sender_id,
        receiver_id,
        annonce_id,
        message
    } = req.body;

    try{

        const result = await db.query(

            `INSERT INTO messages
            (
                sender_id,
                receiver_id,
                annonce_id,
                message
            )

            VALUES
            (
                $1,$2,$3,$4
            )

            RETURNING *`,

            [
                sender_id,
                receiver_id,
                annonce_id,
                message
            ]

        );

        res.json(result.rows[0]);

    }

    catch(e){

        res.status(500).json({
            error:"Erreur serveur"
        });

    }

});

/*
LIRE UNE CONVERSATION
*/

router.get("/chat/:annonce_id/:user1/:user2", async(req,res)=>{

    const db=req.app.locals.db;

    try{

        const result=await db.query(

            `SELECT *

            FROM messages

            WHERE

            annonce_id=$1

            AND

            (

            (sender_id=$2 AND receiver_id=$3)

            OR

            (sender_id=$3 AND receiver_id=$2)

            )

            ORDER BY created_at ASC`,

            [

            req.params.annonce_id,

            req.params.user1,

            req.params.user2

            ]

        );

        res.json(result.rows);

    }

    catch(e){

        res.status(500).json({
            error:"Erreur serveur"
        });

    }

});

export default router;
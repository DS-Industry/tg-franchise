import connection from "../db";

class FranchiseMethod {
    //Поиск франшизы по id
    async searchFrOnId(id){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE WHERE ID = $1';
            await connection.query(sql, [id], async (err, result) => {
                if (err) {
                    console.log(err);
                }else {
                    if (result.rows) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    //Поиск франшизы по названию
    async searchFrOnName(name){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE WHERE NAME = $1';
            await connection.query(sql, [name], async (err, result) => {
                if (err) {
                    console.log(err);
                }else {
                    if (result.rows) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    //Добавить франшизу
    async addFranchise(name, city){
        const sql = 'INSERT INTO FRANCHISE (name, city) VALUES ($1, $2)';
        await connection.query(sql, [name, city], async (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
}
export default FranchiseMethod;
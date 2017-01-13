import {TypeInfo} from '../UltraCreation/Core'
import {TSqliteStorage, TSqlQuery} from '../UltraCreation/Storage'

import {const_data} from './thunderbolt.const'
import {TApplication} from './application'
import {TAssetService} from './asset'
import {TShell} from './loki'

export namespace Initialization
{
    export function Execute(): Promise<void>
    {
        let Storage = new TSqliteStorage(const_data.DatabaseName);

        return Storage.ExecSQL('SELECT name FROM sqlite_master WHERE type="table" AND name="Asset"')
            .then(result =>
            {
                let Init: Promise<void>;
                if (result.rows.length !== 0)
                {
                    Init = Storage.Get('db_version')
                        .then(Value =>
                        {
                            if (Value !== '2')
                                return Storage.ExecSQL(DestroyTableSQL);
                        })
                        .catch(err => Storage.ExecSQL(DestroyTableSQL))
                }
                else
                    Init = Promise.resolve();

                return Init.then(() => Storage.ExecSQL(InitTableSQL));
            })
            .then(() => Storage.ExecSQL(InitDataSQL))
            .then(()=> InitCategory(Storage))
            .then(()=> InitScriptFile(Storage))
            .catch((err) => console.log(err.message))       // data initialization ends here
            .then(() => TApplication.Initialize(Storage))
            .then(()=> TAssetService.Initialize(Storage))
            .then(() => TShell.StartOTG())
            .catch((err) => console.log(err.message));
    }

    function InitCategory(Storage: TSqliteStorage): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.Category)
        {
            // Id, ObjectName, Name, Desc, ExtraProp, en_Name, en_Desc
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'Category', iter.Name, iter.Desc, null]));
            queries.push(new TSqlQuery(InsertCategory, [iter.Id, iter.Icon]));
        }

        return Storage.ExecQuery(queries).then(() => {});
    }

    function InitScriptFile(Storage: TSqliteStorage): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.ScriptFile)
        {
            let DescId: string = null;

            if (TypeInfo.Assigned((iter as any).Desc))
                DescId = (iter as any).Desc;
            else
                DescId = iter.Name + '_desc';

            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'ScriptFile', iter.Name, DescId, null]));
            // Id, Category_Id, Mode_Id, Body_Id, Author, Content
            queries.push(new TSqlQuery(InsertScriptFile, [iter.Id, iter.Category_Id, iter.Mode_Id, iter.Body_Id, iter.Author, iter.content]));
        }

        return Storage.ExecQuery(queries).then(() => {});
    }
    const InitTableSQL: string[] =
    [
    // User Profile
        'CREATE TABLE IF NOT EXISTS User(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY, ' +
            'Email VARCHAR(50) NOT NULL UNIQUE,' +
            'FirstName VARCHAR(50) NOT NULL,' +
            'SurName VARCHAR(50),' +
            'Professional INT);',

        'CREATE TABLE IF NOT EXISTS Profile(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Token TEXT,' +
            'Conf TEXT,' +
            'Role VARCHAR(50),' +
            'Expires DATETIME,' +
            'Timestamp DATETIME,' +
            'FOREIGN KEY(Id) REFERENCES User(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

    // Assets
        'CREATE TABLE IF NOT EXISTS Asset(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'ObjectName VARCHAR(20) NOT NULL,' +
            'Name VARCHAR(50) NOT NULL,' +
            'Desc VARCHAR(50), ' +
            'ExtraProp TEXT);',                 // extra properties persist in json
        'CREATE INDEX IF NOT EXISTS IDX_Asset_ObjectName ON Asset(ObjectName, Name);',

        'CREATE TABLE IF NOT EXISTS Mode(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Icon INT NOT NULL,' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS Body(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Icon INT NOT NULL,' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS Category(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Icon INT NULL,' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS ScriptFile(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Category_Id VARCHAR(38) NOT NULL,' +
            'Mode_Id VARCHAR(38),' +
            'Body_Id VARCHAR(38),' +
            'Author VARCHAR(100),' +
            'Duration INT,' +
            'Md5 CHAR(32),' +
            'Content TEXT,' +
            'Timestamp DATETIME DEFAULT(0),' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(Category_Id) REFERENCES Category(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(Body_Id) REFERENCES Body(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(Mode_Id) REFERENCES Mode(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS ScriptFileDesc(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'ScriptFile_Id VARCHAR(38) NOT NULL,' +
            'Idx INT NOT NULL,' +
            'Professional BOOLEAN DEFAULT(0),' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(ScriptFile_Id) REFERENCES ScriptFile(Id) ON UPDATE CASCADE ON DELETE CASCADE);',
    ];

    const DestroyTableSQL: string [] =
    [
        'DROP TABLE IF EXISTS ScriptFileDesc',
        'DROP TABLE IF EXISTS ScriptFile',
        'DROP TABLE IF EXISTS Favorite',
        'DROP TABLE IF EXISTS Mode',
        'DROP TABLE IF EXISTS Body',
        'DROP TABLE IF EXISTS Category',
        'DROP TABLE IF EXISTS Asset',

        'DROP TABLE IF EXISTS Profile',
        'DROP TABLE IF EXISTS User',
    ];

    const InitDataSQL: string[] =
    [
    // anonymous
        'INSERT OR REPLACE INTO User(Id, FirstName, Email) VALUES("' +
            const_data.Anonymous.Id + '","' + const_data.Anonymous.Name + '","' + const_data.Anonymous.Email + '");',
        'INSERT OR REPLACE INTO Profile(Id) VALUES("' + const_data.Anonymous.Id + '");'
    ];

    const InsertAsset = 'INSERT OR REPLACE INTO Asset(Id, ObjectName, Name, Desc, ExtraProp) VALUES(?,?,?,?,?)';
    //const InsertBody = 'INSERT OR REPLACE INTO Body(Id, Icon) VALUES(?,?)';
    //const InsertMode = 'INSERT OR REPLACE INTO Mode(Id, Icon) VALUES(?,?)';
    const InsertCategory = 'INSERT OR REPLACE INTO Category(Id, Icon) VALUES(?, ?)';
    const InsertScriptFile = 'INSERT OR REPLACE INTO ScriptFile(Id, Category_Id, Mode_Id, Body_Id, Author, Content) VALUES(?,?,?,?,?,?)';
}

/* drop tables
    DROP TABLE IF EXISTS ScriptFileDesc;
    DROP TABLE IF EXISTS ScriptFile;
    DROP TABLE IF EXISTS Favorite;
    DROP TABLE IF EXISTS Mode;
    DROP TABLE IF EXISTS Body;
    DROP TABLE IF EXISTS Category;
    DROP TABLE IF EXISTS Asset;

    DROP TABLE IF EXISTS Profile;
    DROP TABLE IF EXISTS User;
*/
/**
 * @jest-environment ./test/jest.custom-kdbx-environment
 */
/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 */
import * as kdbxweb from "kdbxweb";
import argon2 from "./argon2.test-lib";
import ResourcesKdbxExporter from "./resourcesKdbxExporter";
import ExportResourcesFileEntity from "../../entity/export/exportResourcesFileEntity";
import fs from "fs";

global.kdbxweb = kdbxweb;
kdbxweb.CryptoEngine.argon2 = argon2;

describe("ResourcesKdbxExporter", () => {
  function buildImportResourceDto(num, data) {
    return Object.assign({
      id: `7f077753-0835-4054-92ee-556660ea04a${num}`,
      name: `Password ${num}`,
      username: `username${num}`,
      uri: `https://url${num}.com`,
      description: `Description ${num}`,
      secret_clear: `Secret ${num}`,
      folder_parent_path: '',
      expired: null,
    }, data);
  }

  function buildExternalFolderDto(num, data) {
    return Object.assign({
      id: `7f077753-0835-4054-92ee-556660ea04f${num}`,
      name: `Folder ${num}`,
      folder_parent_path: ""
    }, data);
  }

  it("should export with no content", async() => {
    const exportDto = {
      "format": "kdbx",
      "export_resources": [],
      "export_folders": []
    };

    const exportEntity = new ExportResourcesFileEntity(exportDto);
    const exporter = new ResourcesKdbxExporter(exportEntity);
    await exporter.export();

    expect(exportEntity.file).toBeInstanceOf(ArrayBuffer);

    const kdbxCredentials = new kdbxweb.Credentials(null, null);
    await kdbxweb.Kdbx.load(exportEntity.file, kdbxCredentials);
  });

  it("should export resources and folders", async() => {
    expect.assertions(14);

    const now = new Date();
    now.setMilliseconds(0);

    const exportFolder1 = buildExternalFolderDto(1);
    const exportFolder2 = buildExternalFolderDto(2, {"folder_parent_path": "Folder 1", "folder_parent_id": exportFolder1.id});
    const exportResource1 = buildImportResourceDto(1);
    const exportResource2 = buildImportResourceDto(2, {"folder_parent_path": "Folder 1", "folder_parent_id": exportFolder1.id});
    const exportResource3 = buildImportResourceDto(3, {"folder_parent_path": "Folder 1/Folder2", "folder_parent_id": exportFolder2.id});
    const exportResource4 = buildImportResourceDto(4, {"expired": now.toISOString()});
    const exportDto = {
      "format": "kdbx",
      "export_resources": [exportResource1, exportResource2, exportResource3, exportResource4],
      "export_folders": [exportFolder1, exportFolder2]
    };

    const exportEntity = new ExportResourcesFileEntity(exportDto);
    const exporter = new ResourcesKdbxExporter(exportEntity);
    await exporter.export();

    expect(exportEntity.file).toBeInstanceOf(ArrayBuffer);

    const kdbxCredentials = new kdbxweb.Credentials(null, null);
    const kdbxDb = await kdbxweb.Kdbx.load(exportEntity.file, kdbxCredentials);

    const kdbxRoot = kdbxDb.groups[0];
    const password1 = kdbxRoot.entries[0];
    const password4 = kdbxRoot.entries[1];

    const kdbxBin = kdbxRoot.groups[0];

    const folder1 = kdbxRoot.groups[1];
    const password2 = folder1.entries[0];

    const folder2 = folder1.groups[0];
    const password3 = folder2.entries[0];

    expect(kdbxRoot.name).toEqual("passbolt export");
    expect(kdbxBin.name).toEqual("Recycle Bin");
    expect(folder1.name).toEqual("Folder 1");

    expect(password1.fields.get('Title')).toEqual("Password 1");
    expect(password1.times.expires).toStrictEqual(false);
    expect(password1.times.expiryTime).toBeUndefined();

    expect(password1.fields.get('Password').getText()).toEqual("Secret 1");

    expect(password4.fields.get('Title')).toEqual("Password 4");
    expect(password4.times.expires).toStrictEqual(true);
    expect(password4.times.expiryTime).toStrictEqual(new Date(now));

    expect(folder2.name).toEqual("Folder 2");
    expect(password2.fields.get('Title')).toEqual("Password 2");
    expect(password3.fields.get('Title')).toEqual("Password 3");
  });

  it("should protect an export with a password", async() => {
    const exportResource1 = buildImportResourceDto(1);
    const exportDto = {
      "format": "kdbx",
      "export_resources": [exportResource1],
      "options": {
        "credentials": {
          "password": "passbolt"
        }
      }
    };

    const exportEntity = new ExportResourcesFileEntity(exportDto);
    const exporter = new ResourcesKdbxExporter(exportEntity);
    await exporter.export();

    expect(exportEntity.password).toEqual(exportDto.options.credentials.password);
    expect(exportEntity.file).toBeInstanceOf(ArrayBuffer);

    const kdbxCredentials = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(exportEntity.password), null);
    await kdbxweb.Kdbx.load(exportEntity.file, kdbxCredentials);
  });

  it("should protect an export with a keyfile", async() => {
    const keyfile = fs.readFileSync("./src/all/background_page/model/import/resources/kdbx/kdbx-keyfile.key", {encoding: 'base64'});
    const exportResource1 = buildImportResourceDto(1);
    const exportDto = {
      "format": "kdbx",
      "export_resources": [exportResource1],
      "options": {
        "credentials": {
          "keyfile": keyfile
        }
      }
    };

    const exportEntity = new ExportResourcesFileEntity(exportDto);
    const exporter = new ResourcesKdbxExporter(exportEntity);
    await exporter.export();

    expect(exportEntity.password).toEqual(exportDto.options.credentials.password);
    expect(exportEntity.file).toBeInstanceOf(ArrayBuffer);

    const kdbxCredentials = new kdbxweb.Credentials(null, kdbxweb.ByteUtils.base64ToBytes(exportEntity.keyfile));
    await kdbxweb.Kdbx.load(exportEntity.file, kdbxCredentials);
  });
});

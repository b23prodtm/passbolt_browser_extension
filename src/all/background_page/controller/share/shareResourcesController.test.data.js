/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) 2022 Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) 2022 Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 * @since         3.6.0
 */
import {v4 as uuidv4} from "uuid";
import {pgpKeys} from "../../../tests/fixtures/pgpKeys/keys";
import {users} from "../../model/entity/user/userEntity.test.data";
import {readSecret} from "../../model/entity/secret/secretEntity.test.data";
import {readPermission} from "../../model/entity/permission/permissionEntity.test.data";
import {readResource} from "../../model/entity/resource/resourceEntity.test.data";
import {EncryptMessageService} from "../../service/crypto/encryptMessageService";

async function buildReadSecret(userId, resourceId, decryptedPrivateKey, cleartextMessage) {
  return readSecret({
    user_id: userId,
    resource_id: resourceId,
    data: await EncryptMessageService.encrypt(cleartextMessage, decryptedPrivateKey),
  });
}

export const _3ResourcesSharedWith3UsersResourcesDto = async() => {
  const resource1Id = uuidv4();
  const resource2Id = uuidv4();
  const resource3Id = uuidv4();

  const userAda = users.ada;
  const userAdmin = users.admin;
  const userBetty = users.betty;

  const resource1PermissionOwner = readPermission({
    aco_foreign_key: resource1Id,
    aro_foreign_key: userAda.id,
  });

  const resource2PermissionOwner = readPermission({
    aco_foreign_key: resource2Id,
    aro_foreign_key: userAda.id,
  });

  const resource3PermissionOwner = readPermission({
    aco_foreign_key: resource3Id,
    aro_foreign_key: userAda.id,
  });

  const resource1FullPermissionAda = readPermission({
    aco_foreign_key: resource1Id,
    aro_foreign_key: userAda.id,
    user: userAda,
    group: null
  });

  const resource2FullPermissionAda = readPermission({
    aco_foreign_key: resource2Id,
    aro_foreign_key: userAda.id,
    user: userAda,
    group: null
  });

  const resource3FullPermissionAda = readPermission({
    aco_foreign_key: resource3Id,
    aro_foreign_key: userAda.id,
    user: userAda,
    group: null
  });

  const resource2FullPermissionAdmin = readPermission({
    aco_foreign_key: resource2Id,
    aro_foreign_key: userAdmin.id,
    user: userAdmin,
    group: null
  });

  const resource3FullPermissionBetty = readPermission({
    aco_foreign_key: resource3Id,
    aro_foreign_key: userBetty.id,
    user: userBetty,
    group: null
  });

  const secret1 = await buildReadSecret(userAda.id, resource1Id, pgpKeys.ada.public, "secret1");
  const secret2 = await buildReadSecret(userAda.id, resource2Id, pgpKeys.ada.public, "secret2");
  const secret3 = await buildReadSecret(userAda.id, resource3Id, pgpKeys.ada.public, "secret3");

  const resource1 = readResource({
    id: resource1Id,
    permission: resource1PermissionOwner,
    permissions: [resource1FullPermissionAda],
    secrets: [secret1]
  });

  const resource2 = readResource({
    id: resource2Id,
    permission: resource2PermissionOwner,
    permissions: [resource2FullPermissionAda, resource2FullPermissionAdmin],
    secrets: [secret2]
  });

  const resource3 = readResource({
    id: resource3Id,
    permission: resource3PermissionOwner,
    permissions: [resource3FullPermissionAda, resource3FullPermissionBetty],
    secrets: [secret3]
  });

  return [resource1, resource2, resource3];
};

export const createChangesDto = (data = {}) => {
  const defaultData = {
    aco: "Resource",
    aco_foreign_key: uuidv4(),
    aro: "User",
    aro_foreign_key: uuidv4(),
    is_new: true,
    type: 1
  };
  return Object.assign(defaultData, data);
};

// Cây phả hệ dị thú đa nhánh và cơ chế tự động phân tầng cảnh giới & thế giới.
// Nạp trực tiếp từ file XML 'src/data/beast-lineage.xml'.
import rawXml from './beast-lineage.xml?raw';
import type { El } from './core';

export interface BeastLineageNode {
  n: string;
  parent?: string;
  el: El;
  order: number;
  shjLineage?: boolean;
  myth?: boolean;
}

export interface LineageTreeNode {
  id: string;              // Đường dẫn định danh duy nhất trên cây
  n: string;               // Tên loài
  el: El;                  // Hệ nguyên tố
  parent?: LineageTreeNode;
  parentId?: string;
  parentName?: string;
  children: LineageTreeNode[];
  minRealm: number;        // Cảnh giới tối thiểu tự động tính
  minWorld: number;        // Thế giới tối thiểu tự động tính
  order: number;
  depthFromRoot: number;   // Khoảng cách từ Root xuống node này
  heightToLeaf: number;    // Khoảng cách từ node này xuống lá xa nhất
  fullPathToRoot: string[];// Chuỗi tên loài từ node này lên tới Root
  myth: boolean;           // Có cơ sở truyền thuyết (Sơn Hải Kinh / Thần thoại)
}

export interface EvolutionBranch {
  targetName: string;
  targetNodeId: string;
  targetEl: El;
  ultimateAncestor: string;
  fullLineage: string[];
  minRealm: number;
  minWorld: number;
  desc: string;
  myth: boolean;
}

export interface BeastReq {
  minWorld: number;
  minRealm: number;
}

/** Danh sách các loài có cơ sở truyền thuyết (Sơn Hải Kinh / Tứ Linh / Thần thoại Á Đông). */
export const MYTHIC_BEAST_SET = new Set<string>([
  // Tứ Linh & Thần Thú Tối Cao
  'Tổ Long', 'Chân Long', 'Kim Long', 'Mộc Long', 'Thủy Long', 'Hỏa Long', 'Thổ Long',
  'Lôi Long', 'Phong Long', 'Băng Long', 'Quang Long', 'Ám Long',
  'Ứng Long', 'Chúc Long', 'Thanh Long',
  
  // Long Sinh Cửu Tử
  'Tù Ngưu', 'Nhai Tí', 'Trào Phong', 'Bồ Lao', 'Toan Nghê', 'Bá Hạ', 'Bệ Ngạn', 'Phụ Hí', 'Si Vẫn',
  
  // Phượng tộc
  'Chân Phượng', 'Phượng Hoàng', 'Hỏa Phượng', 'Băng Phượng', 'Thanh Loan', 'Chu Tước',
  'Thái Dương Thần Điểu', 'Tam Túc Kim Ô', 'Tất Phương', 'Lôi Đình Linh Phượng',
  'Bạch Phượng', 'Thanh Phượng', 'Hoàng Phượng', 'Thủy Loan', 'U Minh Phượng', 'Ngũ Sắc Linh Phượng',
  
  // Kỳ Lân tộc
  'Thủy Kỳ Lân', 'Kỳ Lân', 'Hỏa Kỳ Lân', 'Kim Lân Thú', 'Tử Điện Kỳ Lân', 'Mặc Kỳ Lân',
  'Ngự Phong Kỳ Lân', 'Hàn Băng Kỳ Lân', 'Thanh Mộc Kỳ Lân', 'Thánh Quang Kỳ Lân', 'Ám Dạ Kỳ Lân',
  
  // Côn Bằng & Huyền Vũ & Bạch Hổ & Bạch Trạch
  'Côn Bằng', 'Bắc Minh Cự Côn', 'Kim Sí Đại Bằng', 'Cự Côn',
  'Huyền Vũ', 'Huyền Quy Thần', 'Huyền Quy', 'Cửu U Thần Quy',
  'Bạch Hổ', 'Bạch Hổ Vương',
  'Bạch Trạch', 'Bạch Trạch Thánh Thú', 'Bạch Trạch Linh Thú',
  
  // Lang tộc truyền thuyết
  'Thiên Cẩu', 'Ngân Nguyệt Lang Vương',
  
  // Hồ tộc truyền thuyết
  'Cửu Vĩ Hồ', 'Bát Vĩ Hồ', 'Thất Vĩ Hồ', 'Lục Vĩ Hồ', 'Ngũ Vĩ Hồ', 'Tứ Vĩ Hồ',
  'Tam Vĩ Hồ', 'Nhị Vĩ Hồ', 'Nhất Vĩ Hồ', 'Lung Điệt',
  
  // Viên Hầu
  'Chu Yếm', 'Tinh Tinh', 'Ung Hòa',
  
  // Thôn Thiên Cự Thú
  'Thôn Thiên Cự Thú',
  
  // Toàn bộ 29 Thần Thú, Hung Thú & Dị Thú Sơn Hải Kinh
  'Đế Giang', 'Lục Túc Tứ Dực Đế Giang',
  'Bào Hào', 'Nách Mục Nhân Diện Thao Thú',
  'Cùng Kỳ', 'Thiết Mao Khiếu Ngưu',
  'Lục Ngô', 'Cửu Vĩ Nhân Diện Hổ',
  'Quỳ', 'Phong Vũ Chấn Hải Quỳ',
  'Ngung Cường', 'Điểu Thân Chấp Xà Thần',
  'Thừa Hoàng', 'Bối Sinh Độc Giác Hồ',
  'Phì Di', 'Lục Túc Tứ Dực Xà',
  'Vũ La', 'Báo Văn Ngọc Xỉ Thần',
  'Tranh', 'Ngũ Vĩ Độc Giác Báo',
  'Ngao Yết', 'Tứ Giác Bạch Ngưu',
  'Bác', 'Nhất Sừng Hắc Đuôi Bác Mã',
  'Hoan Sơ', 'Vân Văn Độc Giác Mã',
  'Trường Xà', 'Bách Trượng Trư Mao Xà',
  'Á Dủ', 'Xích Diện Nhân Thân Ngưu',
  'Chư Hoài', 'Tứ Giác Nhân Mục Ngưu',
  'Thiên Mã', 'Bạch Đầu Phi Thiên Khuyển',
  'Toan Dư', 'Tứ Dực Lục Mục Xà',
  'Tinh Vệ', 'Hoa Đầu Bạch Chủy Điểu',
  'Linh Linh', 'Hổ Văn Nhân Thanh Ngưu',
  'Hợp Dũ', 'Nhân Diện Kim Vĩ Trư',
  'Phỉ', 'Bạch Đầu Độc Mục Xà Ngưu',
  'Lương Cừ', 'Bạch Đầu Hổ Trảo Miêu',
  'Lung Chất', 'Độc Giác Khiếu Trư',
  'Thổ Lâu', 'Tứ Giác Thực Nhân Dương',
  'Khâm Nguyên', 'Tử Vũ Độc Phong',
  'Cổ Điêu', 'Độc Giác Khốc Điêu',
  'Bác Thi', 'Cửu Vĩ Tứ Nhãn Dương',
  'Trệ', 'Ngưu Vĩ Khiếu Hổ',
  
  // Khác
  'Cửu Đầu Xà', 'Cửu Đầu Sư Vương',

  // Hỗn Thế Tứ Hầu & Tây Du Ký Thần Yêu
  'Linh Minh Thạch Hầu', 'Xích Khào Mã Hầu', 'Thông Tí Viên Hầu', 'Lục Nhĩ Mĩ Hầu',
  'Hắc Hùng Tinh', 'Bạch Cốt Tinh', 'Độc Giác Thanh Ngưu', 'Lục Nha Bạch Tượng', 'Cổ Cự Tượng',
  'Bàn Ty Chu Yêu', 'Bách Nhãn Ngô Công', 'Tỳ Bà Độc Hạt', 'Hoàng Phong Điêu Thử',
  'Tịch Hàn Tam Đầu Tê', 'Bích Ba Cửu Đầu Điểu', 'Ngải Diệp Hoa Báo', 'Bích Khâu Bạch Lộc',
  'Thái Âm Thần Thố', 'Thái Âm Ngọc Thố', 'Hắc Thủy Cự Ngạc', 'Thanh Hải Thần Long',
]);

/** Tự động xác định thế giới tối thiểu dựa theo các mốc trần cảnh giới WORLD_CAP của game. */
export function minWorldFromRealm(r: number): number {
  if (r <= 9) return 0;   // Thương Lan Giới (Phàm Nhân -> Độ Kiếp)
  if (r <= 12) return 1;  // Linh Giới (Nhân Tiên -> Thiên Tiên)
  if (r <= 15) return 2;  // Tiên Giới (Chân Tiên -> Kim Tiên)
  if (r <= 18) return 3;  // Thần Giới (Thái Ất -> Chuẩn Thánh)
  if (r <= 20) return 4;  // Hồng Hoang (Thánh Nhân -> Hợp Đạo)
  return 5;               // Hỗn Độn (Đại Đạo r=21)
}

export function parseBeastLineage(xmlText: string) {
  const cleanXml = xmlText.replace(/<!--[\s\S]*?-->/g, '');
  const tagRegex = /<([^>]+)>/g;

  interface StackEntry {
    name: string;
    el: El;
    node: LineageTreeNode;
  }

  const stack: StackEntry[] = [];
  const allNodes: LineageTreeNode[] = [];
  const nodesByName = new Map<string, LineageTreeNode[]>();
  const nodesById = new Map<string, LineageTreeNode>();

  let nodeCounter = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cleanXml)) !== null) {
    let content = match[1].trim();
    if (!content) continue;

    const isClose = content.startsWith('/');
    const isSelfClose = content.endsWith('/');

    if (isClose) {
      const tagName = content.slice(1).trim();
      if (tagName === 'BeastLineage') continue;
      if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
        stack.pop();
      }
      continue;
    }

    if (isSelfClose) {
      content = content.slice(0, -1).trim();
    }

    let tagName = content;
    let attrs = '';
    const elIdx = content.search(/\s+el\s*=/i);
    if (elIdx !== -1) {
      tagName = content.slice(0, elIdx).trim();
      attrs = content.slice(elIdx).trim();
    }

    if (tagName === 'BeastLineage') continue;

    const elMatch = attrs.match(/el\s*=\s*["']([^"']+)["']/i);
    let el: El = 'hoa';
    if (elMatch) {
      el = elMatch[1] as El;
    } else if (stack.length > 0) {
      el = stack[stack.length - 1].el;
    }

    const mythMatch = attrs.match(/myth\s*=\s*["']?([^"'\s>]+)["']?/i);
    const myth = mythMatch ? (mythMatch[1] === '1' || mythMatch[1].toLowerCase() === 'true') : MYTHIC_BEAST_SET.has(tagName);

    const parentEntry = stack.length > 0 ? stack[stack.length - 1] : undefined;
    const parentNode = parentEntry?.node;
    nodeCounter++;
    const pathPrefix = parentNode ? parentNode.id : 'root';
    const nodeId = `${pathPrefix}/${tagName}#${nodeCounter}`;

    const node: LineageTreeNode = {
      id: nodeId,
      n: tagName,
      el,
      parent: parentNode,
      parentId: parentNode?.id,
      parentName: parentNode?.n,
      children: [],
      minRealm: 0,
      minWorld: 0,
      order: parentNode ? parentNode.children.length : 0,
      depthFromRoot: parentNode ? parentNode.depthFromRoot + 1 : 0,
      heightToLeaf: 0,
      fullPathToRoot: [],
      myth,
    };

    if (parentNode) {
      parentNode.children.push(node);
    }

    allNodes.push(node);
    nodesById.set(nodeId, node);
    if (!nodesByName.has(tagName)) nodesByName.set(tagName, []);
    nodesByName.get(tagName)!.push(node);

    if (!isSelfClose) {
      stack.push({ name: tagName, el, node });
    }
  }

  // TÍNH TOÁN CHIỀU CAO (heightToLeaf) VÀ ĐƯỜNG ĐI LÊN GỐC (fullPathToRoot)
  const calcHeight = (n: LineageTreeNode): number => {
    if (n.children.length === 0) {
      n.heightToLeaf = 0;
      return 0;
    }
    n.heightToLeaf = 1 + Math.max(...n.children.map(calcHeight));
    return n.heightToLeaf;
  };

  const rootNodes = allNodes.filter(n => !n.parent);
  rootNodes.forEach(calcHeight);

  // Tính fullPathToRoot và minRealm / minWorld cho từng node
  allNodes.forEach(node => {
    const path: string[] = [];
    let curr: LineageTreeNode | undefined = node;
    while (curr) {
      path.push(curr.n);
      curr = curr.parent;
    }
    node.fullPathToRoot = path;

    const isLeaf = node.children.length === 0;
    const isRoot = !node.parent;
    const totalLineageSteps = node.heightToLeaf + node.depthFromRoot;

    if (isLeaf) {
      node.minRealm = 0;
      node.minWorld = 0;
      return;
    }

    if (isRoot) {
      if (totalLineageSteps >= 8 || node.n === 'Tổ Long' || node.n === 'Chân Phượng' || node.n === 'Thủy Kỳ Lân' || node.n === 'Thôn Thiên Cự Thú') {
        node.minRealm = 21; // Hỗn Độn (world 5)
      } else {
        node.minRealm = 19; // Hồng Hoang (world 4)
      }
    } else {
      const avgInterval = 21 / Math.max(1, totalLineageSteps);
      node.minRealm = Math.min(20, Math.max(1, Math.round(node.heightToLeaf * avgInterval)));
    }

    node.minWorld = minWorldFromRealm(node.minRealm);
  });

  // Mảng BeastLineageNode để tương thích ngược 100% với các hàm tra cứu cũ
  const flatNodes: BeastLineageNode[] = allNodes.map(n => ({
    n: n.n,
    parent: n.parentName,
    el: n.el,
    order: n.order,
    myth: n.myth,
  }));

  return { allNodes, nodesById, nodesByName, rootNodes, flatNodes };
}

// Khởi tạo phả hệ động từ file XML
const parsed = parseBeastLineage(rawXml);

/** Danh sách phả hệ dị thú toàn game (được parse động từ src/data/beast-lineage.xml). */
export const BEAST_LINEAGE: BeastLineageNode[] = parsed.flatNodes;

/** Tạo cấu trúc chi tiết cho 1 nhánh tiến hóa */
function makeBranch(targetNode: LineageTreeNode): EvolutionBranch {
  const fullLineage = [...targetNode.fullPathToRoot];
  const ultimateAncestor = fullLineage[fullLineage.length - 1] || targetNode.n;
  const elName = targetNode.el === 'none' ? 'Vô tính' : targetNode.el.toUpperCase();
  const desc = `Tiến hóa thành 【${targetNode.n}】 (${elName} hệ) — Hướng tới ${ultimateAncestor}`;
  return {
    targetName: targetNode.n,
    targetNodeId: targetNode.id,
    targetEl: targetNode.el,
    ultimateAncestor,
    fullLineage,
    minRealm: targetNode.minRealm,
    minWorld: targetNode.minWorld,
    desc,
    myth: targetNode.myth,
  };
}

/**
 * Lấy danh sách các con đường tiến hóa khả dĩ cho một loài thú.
 * - Nếu người chơi đã khóa vào 1 nhánh cụ thể (currentNodeId): Chỉ trả về 1 nhánh cha duy nhất!
 * - Nếu người chơi ở loài nguyên thủy đa nhánh (chưa khóa): Trả về TẤT CẢ các con đường để lựa chọn!
 */
export function getAvailableEvolutionBranches(
  currentBeastName: string,
  currentNodeId?: string
): EvolutionBranch[] {
  // 1. Đã khóa vào một node cụ thể trên cây
  if (currentNodeId) {
    const node = parsed.nodesById.get(currentNodeId);
    if (node && node.n === currentBeastName && node.parent) {
      return [makeBranch(node.parent)];
    }
  }

  // 2. Chưa khóa nhánh hoặc tra cứu theo tên loài:
  const matchingNodes = parsed.nodesByName.get(currentBeastName) || [];
  const branchMap = new Map<string, EvolutionBranch>();

  for (const node of matchingNodes) {
    if (node.parent) {
      const b = makeBranch(node.parent);
      branchMap.set(b.targetNodeId, b);
    }
  }

  return Array.from(branchMap.values());
}

/**
 * Tự động tính giới hạn thế giới và cảnh giới tối thiểu của loài thú.
 * Hoàn toàn không hardcode, tự động suy ra từ cấu trúc cây trong file beast-lineage.xml.
 */
export function getBeastWorldReq(name: string, currentNodeId?: string): BeastReq {
  if (currentNodeId) {
    const node = parsed.nodesById.get(currentNodeId);
    if (node) return { minWorld: node.minWorld, minRealm: node.minRealm };
  }
  const matching = parsed.nodesByName.get(name);
  if (matching && matching.length > 0) {
    // Nếu có nhiều node cùng tên, lấy mốc nhỏ nhất để không bị chặn oan
    const minRealm = Math.min(...matching.map(m => m.minRealm));
    const minWorld = Math.min(...matching.map(m => m.minWorld));
    return { minWorld, minRealm };
  }
  return { minWorld: 0, minRealm: 2 };
}

/** Danh sách hậu duệ xa nhất (các lá của cây gia phả) - dùng cho xuất thân khởi đầu của Yêu thú. */
export function beastLeafNodes(): { n: string; el: El; nodeId: string }[] {
  const leaves: { n: string; el: El; nodeId: string }[] = [];
  const seen = new Set<string>();
  
  for (const node of parsed.allNodes) {
    if (node.children.length === 0) {
      // Để tránh hiển thị trùng tên loài trên picker khởi tạo, ta lấy lá đại diện
      if (!seen.has(node.n + '_' + node.el)) {
        seen.add(node.n + '_' + node.el);
        leaves.push({ n: node.n, el: node.el, nodeId: node.id });
      }
    }
  }
  return leaves;
}

/** Lấy tất cả các loài hậu duệ lá của một tổ tiên cụ thể. */
export function beastDescendants(ancestor: string): { n: string; el: El }[] {
  const matchingAncestors = parsed.nodesByName.get(ancestor) || [];
  const res: { n: string; el: El }[] = [];
  const seen = new Set<string>();

  const collectLeaves = (node: LineageTreeNode) => {
    if (node.children.length === 0) {
      if (!seen.has(node.n)) {
        seen.add(node.n);
        res.push({ n: node.n, el: node.el });
      }
      return;
    }
    node.children.forEach(collectLeaves);
  };

  matchingAncestors.forEach(a => a.children.forEach(collectLeaves));
  return res;
}

/** Tìm toàn bộ chuỗi tiến hóa từ loài sơ khai đến đỉnh tối thượng của dòng gia phả. */
export function getSpeciesLineagePath(beastName: string, currentNodeId?: string): string[] {
  if (currentNodeId) {
    const node = parsed.nodesById.get(currentNodeId);
    if (node) return [...node.fullPathToRoot];
  }
  const matching = parsed.nodesByName.get(beastName);
  if (matching && matching.length > 0) {
    return [...matching[0].fullPathToRoot];
  }
  return [beastName];
}



/** Kiểm tra xem một loài thú có cơ sở truyền thuyết (Sơn Hải Kinh / Thần thoại) hay không. */
export function isMythicBeast(name?: string): boolean {
  if (!name) return false;
  if (MYTHIC_BEAST_SET.has(name)) return true;
  const nodes = parsed.nodesByName.get(name);
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(n => n.myth);
}

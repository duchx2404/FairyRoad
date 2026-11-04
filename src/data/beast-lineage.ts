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


export interface BeastFamilyInfo {
  ancestor: string;
  el: El;
  myth: boolean;
  cat: 'taico' | 'hau' | 'dieu' | 'tu_hung' | 'son_hai';
  catName: string;
  tier: 1 | 2 | 3 | 4 | 5; // 5: Thần Phẩm, 4: Thiên Phẩm, 3: Địa Phẩm, 2: Huyền Phẩm, 1: Hoàng Phẩm
  tierName: string;
  weight: number;          // Trọng số xuất hiện (giảm dần theo phẩm cấp)
  title: string;
  starterName: string;
  starterEl: El;
  starterNodeId?: string;
  pathDesc: string;
}

/** Danh mục các dòng dõi phả hệ thượng cổ để người chơi lựa chọn khi tạo nhân vật. */
export function getBeastFamilies(): BeastFamilyInfo[] {
  const customInfo: Record<string, { cat: BeastFamilyInfo['cat']; catName: string; title: string; path: string }> = {
    'Tổ Long': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Vạn Long Chi Tổ · Thái Cổ Thần Long', path: 'Thanh Lân Mãng ➔ Giao Long / 10 Rồng Nguyên Tố / 9 Con Rồng ➔ Chân Long ➔ Tổ Long' },
    'Chân Phượng': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Bách Điểu Chi Vương · Bất Diệt Thần Phượng', path: 'Linh Vũ Điểu ➔ Chu Tước / Thanh Loan / Khổng Tước / Kim Sí Đại Bằng ➔ Chân Phượng' },
    'Thủy Kỳ Lân': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Vạn Thú Chi Trưởng · Tường Thụy Thần Thú', path: 'Linh Lân Thú ➔ Hỏa / Mặc / Ngọc Kỳ Lân ➔ Thủy Kỳ Lân' },
    'Côn Bằng': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Bắc Minh Thần Thú · Thôn Hải Liệt Không', path: 'Côn Ngư ➔ Bắc Minh Kình Ngư ➔ Cự Bằng ➔ Côn Bằng' },
    'Huyền Vũ': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Bắc Phương Chân Thần · Thác Thiên Chi Khí', path: 'Linh Quy ➔ Long Quy / Quy Xà ➔ Chân Vũ ➔ Huyền Vũ' },
    'Bạch Hổ': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Tây Phương Sát Thần · Canh Kim Chi Tinh', path: 'Linh Hổ ➔ Liệt Viêm Hổ / Canh Kim Hổ ➔ Bạch Hổ' },
    'Cửu Vĩ Hồ': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Thanh Khâu Hồ Tộc · Huyễn Biến Thiên Cơ', path: 'Nhất Vĩ Hồ / Tuyết Ảnh / Xích Diễm ➔ Tam Vĩ ➔ Lục Vĩ ➔ Cửu Vĩ Hồ' },
    'Bạch Trạch': { cat: 'taico', catName: 'Thần Thú Thái Cổ', title: 'Thông Hiểu Vạn Vật · Thượng Cổ Thụy Thú', path: 'Ấu Bạch Trạch / Linh Lộc ➔ Bạch Trạch' },

    'Chu Yếm': { cat: 'hau', catName: 'Hỗn Thế Thần Hầu', title: 'Bạch Thủ Xích Túc · Hỗn Thế Tứ Hầu Chi Tổ', path: 'Hoa Quả Sơn Linh Hầu [none] ➔ Linh Minh Thạch Hầu / Lục Nhĩ / Thông Tí / Xích Khào ➔ Chu Yếm' },
    'Tam Túc Kim Ô': { cat: 'dieu', catName: 'Thần Cầm & Tiên Điểu', title: 'Thái Dương Thần Điểu · Chân Hỏa Diệt Thế', path: 'Hỏa Điểu ➔ Xích Viêm Hỏa Điểu ➔ Tam Túc Kim Ô' },
    'Thái Âm Thần Thố': { cat: 'dieu', catName: 'Thần Cầm & Tiên Điểu', title: 'Cung Trăng Giã Dược · Thái Âm Thần Thú', path: 'Linh Thố ➔ Ngọc Thố ➔ Thái Âm Thần Thố' },
    'Kim Sí Đại Bằng Điêu': { cat: 'dieu', catName: 'Thần Cầm & Tiên Điểu', title: 'Sư Đà Lĩnh Thần Điêu · Cửu Vạn Dặm Phi Thiên', path: 'Linh Vũ Điểu ➔ Kim Sí Điêu ➔ Kim Sí Đại Bằng Điêu' },

    'Cùng Kỳ': { cat: 'tu_hung', catName: 'Tứ Hung & Cổ Ma', title: 'Thượng Cổ Tứ Hung · Hống Thiên Trục Phong', path: 'Hống Thiên Thực Nhân Thú ➔ Cùng Kỳ' },
    'Đế Giang': { cat: 'tu_hung', catName: 'Tứ Hung & Cổ Ma', title: 'Lục Túc Tứ Dực · Hỗn Độn Không Khiếu', path: 'Hỗn Độn Nang Thú ➔ Đế Giang' },
    'Bào Hào': { cat: 'tu_hung', catName: 'Tứ Hung & Cổ Ma', title: 'Thao Thiết Cổ Thú · Vạn Vật Giai Thôn', path: 'Phệ Hồn Ma Ảnh ➔ Bào Hào' },
    'Thôn Thiên Cự Thú': { cat: 'tu_hung', catName: 'Tứ Hung & Cổ Ma', title: 'Thái Cổ Cự Yêu · Thôn Thiên Diệt Địa', path: 'Ấu Hải Thú ➔ Thôn Thiên Cự Thú' },
  };

  const list: BeastFamilyInfo[] = [];

  for (const root of parsed.rootNodes) {
    const leaves: { n: string; el: El; nodeId: string; depth: number }[] = [];
    const seen = new Set<string>();

    const collectLeaves = (node: LineageTreeNode) => {
      if (node.children.length === 0) {
        if (!seen.has(node.n + '_' + node.el)) {
          seen.add(node.n + '_' + node.el);
          leaves.push({ n: node.n, el: node.el, nodeId: node.id, depth: node.depthFromRoot });
        }
        return;
      }
      node.children.forEach(collectLeaves);
    };

    collectLeaves(root);
    // Huyết mạch xa nhất của loài đó: depth lớn nhất (xa root nhất), ưu tiên loài không thuộc tính 'none'
    leaves.sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      if (a.el === 'none' && b.el !== 'none') return -1;
      if (b.el === 'none' && a.el !== 'none') return 1;
      return 0;
    });
    const starter = leaves[0] || { n: root.n, el: root.el, nodeId: root.id, depth: 0 };
    const custom = customInfo[root.n];
    const cat = custom?.cat || 'son_hai';

    let tier: 1 | 2 | 3 | 4 | 5 = 1;
    let tierName = 'Hoàng Phẩm';
    let weight = 80;

    if (cat === 'taico') {
      tier = 5; tierName = 'Thần Phẩm'; weight = 4;
    } else if (cat === 'hau' || cat === 'dieu') {
      tier = 4; tierName = 'Thiên Phẩm'; weight = 10;
    } else if (cat === 'tu_hung') {
      tier = 3; tierName = 'Địa Phẩm'; weight = 22;
    } else if (root.myth || root.heightToLeaf >= 2) {
      tier = 2; tierName = 'Huyền Phẩm'; weight = 45;
    }

    list.push({
      ancestor: root.n,
      el: root.el,
      myth: root.myth,
      cat,
      catName: custom?.catName || 'Sơn Hải Dị Thú',
      tier,
      tierName,
      weight,
      title: custom?.title || `${root.n} · Dị Thú Sơn Hải Kinh`,
      starterName: starter.n,
      starterEl: 'none', // Tất cả loài sơ khai khởi đầu 100% là Vô Tính (không nguyên tố)
      starterNodeId: starter.nodeId,
      pathDesc: custom?.path || `${starter.n} [none] ➔ ... ➔ ${root.n}`,
    });
  }

  // Danh sách thuần túy lấy trực tiếp từ các cây phả hệ Root trong XML

  // Sắp xếp: Thần Thú Thái Cổ lên đầu tiên (Tổ Long, Chân Phượng, Thủy Kỳ Lân, Côn Bằng...)
  const catOrder = { taico: 0, hau: 1, dieu: 2, tu_hung: 3, son_hai: 4 };
  const vipPriority: Record<string, number> = {
    'Tổ Long': 1, 'Chân Phượng': 2, 'Thủy Kỳ Lân': 3, 'Côn Bằng': 4,
    'Huyền Vũ': 5, 'Bạch Hổ': 6, 'Cửu Vĩ Hồ': 7, 'Bạch Trạch': 8,
    'Linh Minh Thạch Hầu': 9, 'Tam Túc Kim Ô': 10
  };

  list.sort((a, b) => {
    const pA = vipPriority[a.ancestor] || 99;
    const pB = vipPriority[b.ancestor] || 99;
    if (pA !== pB) return pA - pB;
    const cA = catOrder[a.cat] ?? 99;
    const cB = catOrder[b.cat] ?? 99;
    if (cA !== cB) return cA - cB;
    return a.ancestor.localeCompare(b.ancestor, 'vi');
  });

  return list;
}


/** Rút ngẫu nhiên danh sách thần thú theo trọng số phẩm cấp giảm dần (không trùng lặp). */
export function rollWeightedBeastFamilies(all: BeastFamilyInfo[], count = 3): BeastFamilyInfo[] {
  const pool = [...all];
  const picked: BeastFamilyInfo[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 10), 0);
    let rand = Math.random() * totalWeight;
    let chosenIndex = 0;
    for (let j = 0; j < pool.length; j++) {
      rand -= (pool[j].weight || 10);
      if (rand <= 0) {
        chosenIndex = j;
        break;
      }
    }
    picked.push(pool[chosenIndex]);
    pool.splice(chosenIndex, 1);
  }

  return picked;
}
